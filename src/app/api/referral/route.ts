import { NextRequest, NextResponse } from "next/server";
import { ReferralFormSchema } from "@/schema/api";
import { createManyReferrals, getAllReferrals } from "@/services/referral";
import { sendReferralEmails } from "@/services/email";
import { rateLimiter } from "@/lib/rate-limit";
import { getIdempotentResponse, setIdempotentResponse } from "@/lib/idempotency";
import { validateOrigin } from "@/lib/csrf";
import { requireAdmin } from "@/lib/dal";
import { transformError, errorStatusMap } from "@/utils/errors";

export async function POST(req: NextRequest) {
  if (!validateOrigin(req)) {
    return NextResponse.json({ error: { code: "FORBIDDEN", message: "Invalid origin" } }, { status: 403 });
  }

  const idempotencyKey = req.headers.get("idempotency-key");

  try {
    if (idempotencyKey) {
      const cached = await getIdempotentResponse(idempotencyKey);
      if (cached) {
        return NextResponse.json(cached.body, { status: cached.status });
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
    const { memberName, memberEmail, referralCode, prospects } = ReferralFormSchema.parse(body);

    await sendReferralEmails({ prospects, referralCode, memberName });

    const referrals = prospects.map((prospect) => ({
      memberName,
      memberEmail,
      prospectName: prospect.prospectName,
      prospectEmail: prospect.prospectEmail,
      referralCode,
      redeemed: false,
    }));

    const newReferrals = await createManyReferrals(referrals);

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
    const appError = transformError(error);
    const status = errorStatusMap[appError.code];
    console.error(`[${appError.code}] ${appError.message}`, appError.context);
    return NextResponse.json({ error: { code: appError.code, message: appError.message } }, { status });
  }
}
