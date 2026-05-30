import { NextRequest, NextResponse } from "next/server";
import { verifyTwilioSignature } from "@/lib/sms";
import { revokeConsentByPhone } from "@/services/sms-consent";
import { TwilioInboundSchema } from "@/schema/sms";

const STOP_KEYWORDS = new Set(["stop", "stopall", "unsubscribe", "cancel", "end", "quit", "optout", "revoke"]);

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const params: Record<string, string> = {};
    formData.forEach((value, key) => {
      params[key] = value.toString();
    });

    const signature = req.headers.get("x-twilio-signature") ?? "";
    const url = `${req.nextUrl.origin}/api/sms/inbound`;

    if (!verifyTwilioSignature(signature, url, params)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }

    const parsed = TwilioInboundSchema.safeParse(params);
    if (!parsed.success) {
      return new NextResponse(null, { status: 204 });
    }

    const { From: from, Body: rawBody } = parsed.data;
    const body = rawBody.trim().toLowerCase();

    if (STOP_KEYWORDS.has(body)) {
      await revokeConsentByPhone(from, "sms_reply_stop", rawBody);
    }

    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
