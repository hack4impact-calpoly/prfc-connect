import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, generateToken, getSecret } from "@/lib/dal";
import { PORTAL_TOKEN_COOKIE, validatePortalToken } from "@/lib/api/portal-api";
import { AuthCallbackSchema } from "@/schema/auth";

export async function POST(req: NextRequest) {
  const rawIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "127.0.0.1";
  const ip = /^[\d.:a-f]+$/i.test(rawIp) ? rawIp : "invalid";

  try {
    getSecret();
  } catch {
    return NextResponse.redirect(new URL("/home", req.url), 303);
  }

  const formData = await req.formData();
  const parsed = AuthCallbackSchema.safeParse({ token: formData.get("token") });

  if (!parsed.success) {
    console.warn("[AUTH_CALLBACK] missing or malformed token", ip);
    return NextResponse.redirect(new URL("/home", req.url), 303);
  }

  const { token } = parsed.data;

  const session = await validatePortalToken(token);
  if (!session) {
    console.warn("[AUTH_CALLBACK] invalid or expired token", ip);
    return NextResponse.redirect(new URL("/home", req.url), 303);
  }

  console.info("[AUTH_CALLBACK] login success", session.ownerid, ip);

  const response = NextResponse.redirect(new URL("/home", req.url), 303);
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 3600,
    path: "/",
  };

  response.cookies.set(AUTH_COOKIE, generateToken(session.ownerid, session.isAdmin), cookieOptions);
  response.cookies.set(PORTAL_TOKEN_COOKIE, token, cookieOptions);

  return response;
}
