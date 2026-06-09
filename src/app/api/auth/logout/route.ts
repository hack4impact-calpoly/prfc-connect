import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE } from "@/lib/dal";
import { PORTAL_TOKEN_COOKIE } from "@/lib/api/portal-api";
import { validateOrigin } from "@/lib/csrf";

export async function POST(req: NextRequest) {
  if (!validateOrigin(req)) {
    return NextResponse.json({ error: { code: "FORBIDDEN", message: "Invalid origin" } }, { status: 403 });
  }

  const response = NextResponse.redirect(new URL("/", req.url), 303);
  response.cookies.delete(AUTH_COOKIE);
  response.cookies.delete(PORTAL_TOKEN_COOKIE);
  return response;
}
