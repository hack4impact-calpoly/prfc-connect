import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, validateToken, getSecret } from "@/lib/dal";

export async function POST(req: NextRequest) {
  let secret: string;
  try {
    secret = getSecret();
  } catch {
    return NextResponse.redirect(new URL("/", req.url));
  }

  const formData = await req.formData();
  const token = formData.get("token") as string | null;

  if (!token) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  const session = validateToken(token, secret);
  if (!session) {
    return NextResponse.redirect(new URL("/", req.url));
  }

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
