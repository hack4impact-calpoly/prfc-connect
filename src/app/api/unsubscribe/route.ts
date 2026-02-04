import { NextRequest, NextResponse } from "next/server";
import { verifyUnsubscribeToken } from "@/lib/unsubscribe-tokens";
import prisma from "@/lib/db";
import { transformError, errorStatusMap } from "@/utils/errors";

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    }

    const verification = verifyUnsubscribeToken(token);

    if (!verification.valid) {
      return NextResponse.json({ error: verification.error }, { status: 400 });
    }

    const { memberId, groupId } = verification;

    await prisma.contactGroupMember.updateMany({
      where: {
        memberId: memberId!,
        groupId: groupId!,
      },
      data: {
        notifyEmail: false,
        unsubscribedAt: new Date(),
        unsubscribeMethod: "one-click",
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const appError = transformError(error);
    const status = errorStatusMap[appError.code] || 500;
    console.error("[UNSUBSCRIBE_ERROR]", appError.message, appError.context);
    return NextResponse.json({ error: appError.message }, { status });
  }
}
