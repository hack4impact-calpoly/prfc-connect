import { NextRequest, NextResponse } from "next/server";
import { verifyUnsubscribeToken, verifyEmailUnsubscribeToken } from "@/lib/unsubscribe-tokens";
import { suppressEmail } from "@/services/email-suppression";
import { getMemberById } from "@/lib/api/member-api";
import { transformError, errorStatusMap } from "@/utils/errors";

function isEmailToken(token: string): boolean {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const parts = decoded.split("|");
    return parts.length === 4 && parts[1] === "referral";
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    }

    if (isEmailToken(token)) {
      const verification = verifyEmailUnsubscribeToken(token);

      if (!verification.valid) {
        return NextResponse.json({ error: verification.error }, { status: 400 });
      }

      await suppressEmail(verification.email!, "unsubscribe");

      return new NextResponse(null, { status: 204 });
    }

    const verification = verifyUnsubscribeToken(token);

    if (!verification.valid) {
      return NextResponse.json({ error: verification.error }, { status: 400 });
    }

    const { memberId } = verification;

    const member = await getMemberById(memberId!);
    if (member) {
      await suppressEmail(member.owneremail, "unsubscribe");
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const appError = transformError(error);
    const status = errorStatusMap[appError.code] || 500;
    console.error("[UNSUBSCRIBE_ERROR]", appError.message, appError.context);
    return NextResponse.json({ error: appError.message }, { status });
  }
}
