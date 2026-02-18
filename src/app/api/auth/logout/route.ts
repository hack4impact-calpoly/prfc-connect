import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE } from "@/lib/dal";

export async function POST(req: NextRequest) {
  const response = NextResponse.redirect(new URL("/", req.url));
  response.cookies.delete(AUTH_COOKIE);
  return response;
}
