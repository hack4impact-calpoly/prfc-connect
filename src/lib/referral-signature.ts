import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { getSecret } from "@/lib/dal";
import type { VerifyReferralSignatureParams } from "@/types/referral";

const SIGNATURE_LENGTH = 8;

export function verifyReferralSignature({
  memberName,
  memberEmail,
  referralCode,
  signature,
}: VerifyReferralSignatureParams): boolean {
  if (signature.length !== SIGNATURE_LENGTH) return false;

  const payload = `${memberName}|${memberEmail}|${referralCode}`;
  const expected = createHmac("sha256", getSecret()).update(payload).digest("hex").slice(0, SIGNATURE_LENGTH);

  return timingSafeEqual(Buffer.from(signature, "utf8"), Buffer.from(expected, "utf8"));
}
