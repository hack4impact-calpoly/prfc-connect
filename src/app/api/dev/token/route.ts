import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateToken } from "@/lib/dal";

const DevTokenSchema = z.object({
  ownerid: z.number().int().positive(),
  isAdmin: z.boolean(),
});

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === "production" && process.env.USE_MOCK_MEMBER_API !== "true") {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = DevTokenSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
  }

  const token = generateToken(parsed.data.ownerid, parsed.data.isAdmin);

  return NextResponse.json({ token });
}
