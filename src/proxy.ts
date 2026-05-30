import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_COOKIE = "prfc_auth";
const PROTECTED_PATHS = ["/home", "/groups", "/events", "/messages", "/settings", "/profile", "/referral-database"];

function buildCsp(nonce: string | null): string {
  const scriptSrc = nonce
    ? `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`
    : "script-src 'self' 'unsafe-inline' 'unsafe-eval'";
  const connectSrc = nonce ? "connect-src 'self'" : "connect-src 'self' ws: wss:";
  const directives = [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://*.public.blob.vercel-storage.com",
    "font-src 'self'",
    connectSrc,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "frame-src 'none'",
  ];
  if (nonce) {
    directives.push("upgrade-insecure-requests");
  }
  return directives.join("; ");
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtectedPath = PROTECTED_PATHS.some((p) => pathname.startsWith(p));

  if (isProtectedPath) {
    const hasSession = request.cookies.get(AUTH_COOKIE);
    if (!hasSession?.value) {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
  }

  const nonce = process.env.NODE_ENV === "production" ? btoa(crypto.randomUUID()) : null;
  const csp = buildCsp(nonce);

  const requestHeaders = new Headers(request.headers);
  if (nonce) {
    requestHeaders.set("x-nonce", nonce);
    requestHeaders.set("content-security-policy", csp);
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("content-security-policy", csp);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
