import { NextRequest, NextResponse } from "next/server";
import { env } from "@/env";
import { processEmailQueue } from "@/services/message";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (env.CRON_SECRET && authHeader !== `Bearer ${env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await processEmailQueue();
    return NextResponse.json(result);
  } catch (error) {
    console.error("[CRON_EMAIL_QUEUE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
