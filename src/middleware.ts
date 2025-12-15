import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ACCESS_COOKIE = "prfc_database_access";

function createAuthRateLimiter() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }

  return new Ratelimit({
    redis: new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    }),
    limiter: Ratelimit.slidingWindow(5, "900 s"),
    prefix: "prfc:auth",
  });
}

const authRateLimiter = createAuthRateLimiter();

export async function middleware(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const hasAccess = request.cookies.get(ACCESS_COOKIE);

  if (hasAccess?.value === "verified") {
    return NextResponse.next();
  }

  const password = searchParams.get("pass");

  if (password && authRateLimiter) {
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() ?? "127.0.0.1";
    const { success } = await authRateLimiter.limit(`auth:${ip}`);

    if (!success) {
      return new NextResponse("Too many login attempts", { status: 429 });
    }
  }

  const correctPassword = process.env.DATABASE_PASSWORD;

  if (password && correctPassword && password === correctPassword) {
    const url = request.nextUrl.clone();
    url.searchParams.delete("pass");

    const response = NextResponse.redirect(url, { status: 302 });
    response.cookies.set(ACCESS_COOKIE, "verified", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 28800,
      path: "/",
    });

    return response;
  }

  return NextResponse.redirect(new URL("/", request.url));
}

export const config = {
  matcher: ["/referral-database/:path*"],
};
