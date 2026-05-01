import "server-only";
import prisma from "@/lib/db";
import { transformError } from "@/utils/errors";
import { encrypt, decrypt, blindIndex } from "@/lib/encryption";

export interface SmsConsentRecord {
  id: number;
  memberId: number;
  consentedAt: Date;
  consentMethod: string;
  consentText: string;
  consentPurpose: string;
  revokedAt: Date | null;
  revokeMethod: string | null;
}

export async function getMemberSmsConsent(memberId: number): Promise<SmsConsentRecord | null> {
  try {
    const consent = await prisma.smsConsent.findFirst({
      where: { memberId, revokedAt: null },
      select: {
        id: true,
        memberId: true,
        consentedAt: true,
        consentMethod: true,
        consentText: true,
        consentPurpose: true,
        revokedAt: true,
        revokeMethod: true,
      },
      orderBy: { consentedAt: "desc" },
    });

    return consent;
  } catch (error) {
    throw transformError(error);
  }
}

export async function grantSmsConsent(memberId: number, phone: string): Promise<void> {
  try {
    const existing = await prisma.smsConsent.findFirst({
      where: { memberId, revokedAt: null },
      select: { id: true },
    });
    if (existing) return;

    await prisma.smsConsent.create({
      data: {
        memberId,
        phone: encrypt(phone),
        phoneHash: blindIndex(phone),
        consentMethod: "web_settings",
        consentText:
          "I agree to receive event reminders and group messages via text. Up to 8 msgs/month. Msg & data rates may apply. Reply STOP to cancel.",
        consentPurpose: "group_messaging",
      },
    });
  } catch (error) {
    throw transformError(error);
  }
}

export async function hasActiveConsent(memberId: number): Promise<boolean> {
  try {
    const consent = await prisma.smsConsent.findFirst({
      where: { memberId, revokedAt: null },
      select: { id: true },
    });

    return consent !== null;
  } catch (error) {
    throw transformError(error);
  }
}

export async function revokeSmsConsent(memberId: number, method: string, message: string | null): Promise<void> {
  try {
    await prisma.smsConsent.updateMany({
      where: { memberId, revokedAt: null },
      data: {
        revokedAt: new Date(),
        revokeMethod: method,
        revokeMessage: message,
      },
    });
  } catch (error) {
    throw transformError(error);
  }
}

export async function getConsentedPhones(memberIds: number[]): Promise<Map<number, string>> {
  try {
    const consents = await prisma.smsConsent.findMany({
      where: { memberId: { in: memberIds }, revokedAt: null },
      select: { memberId: true, phone: true },
      orderBy: { consentedAt: "desc" },
    });

    const seen = new Set<number>();
    const result = new Map<number, string>();
    for (const c of consents) {
      if (!seen.has(c.memberId)) {
        seen.add(c.memberId);
        result.set(c.memberId, decrypt(c.phone));
      }
    }
    return result;
  } catch (error) {
    throw transformError(error);
  }
}
