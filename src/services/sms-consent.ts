import "server-only";
import prisma from "@/lib/db";
import { transformError } from "@/utils/errors";

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
