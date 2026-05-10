import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/dal";
import { membersRateLimiter } from "@/lib/rate-limit";
import { getMemberById } from "@/lib/api/member-api";
import { StringIntSchema } from "@/schema/common";
import { AppError, apiErrorHandler } from "@/utils/errors";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await verifySession();

    if (membersRateLimiter) {
      const forwarded = req.headers.get("x-forwarded-for");
      const ip = forwarded?.split(",")[0]?.trim() ?? "127.0.0.1";
      const { success, remaining, reset } = await membersRateLimiter.limit(ip);

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

    const { id } = await params;
    const memberId = StringIntSchema.parse(id);
    const member = await getMemberById(memberId);

    if (!member) {
      throw new AppError("NOT_FOUND", "Member not found");
    }

    return NextResponse.json(member, {
      status: 200,
      headers: {
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return apiErrorHandler(error);
  }
}
