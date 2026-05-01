import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/dal";
import { membersRateLimiter } from "@/lib/rate-limit";
import { getAllMembers } from "@/lib/api/member-api";
import { apiErrorHandler } from "@/utils/errors";

export async function GET(req: NextRequest) {
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

    const members = await getAllMembers();

    return NextResponse.json(members, {
      status: 200,
      headers: {
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return apiErrorHandler(error);
  }
}
