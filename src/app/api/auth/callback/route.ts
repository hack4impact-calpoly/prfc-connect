import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, validateToken, getSecret } from "@/lib/dal";
import { authRateLimiter } from "@/lib/rate-limit";
import { AuthCallbackSchema } from "@/schema/auth";

export async function POST(req: NextRequest) {
  const rawIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "127.0.0.1";
  const ip = /^[\d.:a-f]+$/i.test(rawIp) ? rawIp : "invalid";

  if (authRateLimiter) {
    const { success } = await authRateLimiter.limit(ip);

    if (!success) {
      return new NextResponse("Too many login attempts", { status: 429 });
    }
  }

  let secret: string;
  try {
    secret = getSecret();
  } catch {
    return NextResponse.redirect(new URL("/home", req.url));
  }

  const formData = await req.formData();
  const parsed = AuthCallbackSchema.safeParse({ token: formData.get("token") });

  if (!parsed.success) {
    console.warn("[AUTH_CALLBACK] missing or malformed token", ip);
    return NextResponse.redirect(new URL("/home", req.url));
  }

  const { token } = parsed.data;

  const session = validateToken(token, secret);
  if (!session) {
    console.warn("[AUTH_CALLBACK] invalid or expired token", ip);
    return NextResponse.redirect(new URL("/home", req.url));
  }

  console.info("[AUTH_CALLBACK] login success", session.ownerid, ip);

  const response = NextResponse.redirect(new URL("/home", req.url));

  response.cookies.set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 3600,
    path: "/",
  });

  return response;
}
