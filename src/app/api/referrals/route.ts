import { NextRequest, NextResponse } from "next/server";
import { ReferralFormSchema } from "@/schema/api";
import { createManyReferrals, getAllReferrals } from "@/services/referral";
import { sendReferralEmails } from "@/services/email";
import { env } from "@/env";
import { rateLimiter } from "@/lib/rate-limit";
import { claimIdempotencyKey, setIdempotentResponse } from "@/lib/idempotency";
import { validateOrigin } from "@/lib/csrf";
import { requireAdmin } from "@/lib/dal";
import { verifyReferralSignature } from "@/lib/referral-signature";
import { apiErrorHandler, transformError, errorStatusMap } from "@/utils/errors";

export async function POST(req: NextRequest) {
  const idempotencyKey = req.headers.get("idempotency-key");

  try {
    if (!validateOrigin(req)) {
      return NextResponse.json({ error: { code: "FORBIDDEN", message: "Invalid origin" } }, { status: 403 });
    }

    if (idempotencyKey) {
      const claim = await claimIdempotencyKey(idempotencyKey);
      if (!claim.claimed) {
        return NextResponse.json(claim.response.body, { status: claim.response.status });
      }
    }

    if (rateLimiter) {
      const forwarded = req.headers.get("x-forwarded-for");
      const ip = forwarded?.split(",")[0]?.trim() ?? "127.0.0.1";
      const { success, remaining, reset } = await rateLimiter.limit(ip);

      if (!success) {
        return NextResponse.json(
          { error: { code: "RATE_LIMITED", message: "Too many requests" } },
          {
            status: 429,
            headers: {
              "X-RateLimit-Remaining": remaining.toString(),
              "X-RateLimit-Reset": reset.toString(),
            },
          },
        );
      }
    }

    const body = await req.json();
    const { memberName, memberEmail, referralCode, signature, prospects } = ReferralFormSchema.parse(body);

    if (!verifyReferralSignature({ memberName, memberEmail, referralCode, signature })) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Invalid referral signature" } },
        { status: 403 },
      );
    }

    const referrals = prospects.map((prospect) => ({
      memberName,
      memberEmail,
      prospectName: prospect.prospectName,
      prospectEmail: prospect.prospectEmail,
      referralCode,
      redeemed: false,
    }));

    const newReferrals = await createManyReferrals(referrals);

    if (env.EMAIL_ENABLED) {
      await sendReferralEmails({ prospects, referralCode, memberName });
    }

    console.info("[AUDIT] createReferrals", referralCode, newReferrals.length);

    const responseBody = { message: "Referrals created successfully!", referrals: newReferrals };

    if (idempotencyKey) {
      await setIdempotentResponse(idempotencyKey, 201, responseBody);
    }

    return NextResponse.json(responseBody, { status: 201 });
  } catch (error) {
    const appError = transformError(error);
    const status = errorStatusMap[appError.code];
    const errorBody = { error: { code: appError.code, message: appError.message } };

    console.error(`[${appError.code}] ${appError.message}`, appError.context);

    if (idempotencyKey) {
      await setIdempotentResponse(idempotencyKey, status, errorBody);
    }

    return NextResponse.json(errorBody, { status });
  }
}

export async function GET() {
  try {
    await requireAdmin();
    const referrals = await getAllReferrals();
    return NextResponse.json(referrals, { status: 200 });
  } catch (error) {
    return apiErrorHandler(error);
  }
}
