import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_COOKIE = "prfc_auth";

export async function proxy(request: NextRequest) {
  const hasSession = request.cookies.get(AUTH_COOKIE);

  if (hasSession?.value) {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL("/", request.url));
}

export const config = {
  matcher: ["/referral-database/:path*", "/groups/:path*"],
};
