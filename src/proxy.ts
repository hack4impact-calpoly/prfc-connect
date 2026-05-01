import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { timingSafeEqual } from "crypto";

const AUTH_COOKIE = "prfc_auth";
const PROTECTED_PATHS = ["/home", "/groups", "/events", "/messages", "/settings", "/profile", "/referral-database"];

function isBasicAuthValid(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Basic ")) return false;

  const decoded = atob(authHeader.slice(6));
  const separatorIndex = decoded.indexOf(":");
  if (separatorIndex === -1) return false;

  const username = decoded.slice(0, separatorIndex);
  const password = decoded.slice(separatorIndex + 1);

  const expectedUsername = process.env.STAGING_USERNAME ?? "";
  const expectedPassword = process.env.STAGING_PASSWORD ?? "";
  if (!expectedUsername || !expectedPassword) return false;

  if (username.length !== expectedUsername.length || password.length !== expectedPassword.length) return false;

  const usernameMatch = timingSafeEqual(Buffer.from(username), Buffer.from(expectedUsername));
  const passwordMatch = timingSafeEqual(Buffer.from(password), Buffer.from(expectedPassword));

  return usernameMatch && passwordMatch;
}

export async function proxy(request: NextRequest) {
  if (process.env.STAGING === "true") {
    if (!isBasicAuthValid(request)) {
      return new NextResponse("Authentication required", {
        status: 401,
        headers: { "WWW-Authenticate": 'Basic realm="Staging"' },
      });
    }
  }

  const { pathname } = request.nextUrl;
  const isProtectedPath = PROTECTED_PATHS.some((p) => pathname.startsWith(p));

  if (isProtectedPath) {
    const hasSession = request.cookies.get(AUTH_COOKIE);
    if (!hasSession?.value) {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
