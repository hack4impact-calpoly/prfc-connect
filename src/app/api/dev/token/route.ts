import { NextRequest, NextResponse } from "next/server";
import { generateToken } from "@/lib/dal";

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === "production" && process.env.STAGING !== "true") {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const ownerid = parseInt(body.ownerid, 10);
  const isAdmin = Boolean(body.isAdmin);

  if (isNaN(ownerid)) {
    return NextResponse.json({ error: "Invalid ownerid" }, { status: 400 });
  }

  const token = generateToken(ownerid, isAdmin);

  return NextResponse.json({ token });
}
