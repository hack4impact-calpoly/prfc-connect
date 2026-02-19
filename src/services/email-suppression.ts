import "server-only";
import prisma from "@/lib/db";
import type { EmailSuppressionReason } from "@/generated/prisma/client";
import { transformError } from "@/utils/errors";

export async function isEmailSuppressed(email: string): Promise<boolean> {
  try {
    const suppression = await prisma.emailSuppression.findUnique({
      where: { email: email.toLowerCase() },
    });
    return suppression !== null;
  } catch (error) {
    throw transformError(error);
  }
}

export async function suppressEmail(email: string, reason: EmailSuppressionReason): Promise<void> {
  try {
    await prisma.emailSuppression.upsert({
      where: { email: email.toLowerCase() },
      update: { reason, suppressedAt: new Date() },
      create: { email: email.toLowerCase(), reason },
    });
  } catch (error) {
    throw transformError(error);
  }
}

export async function filterSuppressedEmails(emails: string[]): Promise<{ valid: string[]; suppressed: string[] }> {
  try {
    const suppressions = await prisma.emailSuppression.findMany({
      where: { email: { in: emails.map((e) => e.toLowerCase()) } },
      select: { email: true },
    });

    const suppressedSet = new Set(suppressions.map((s) => s.email));

    return {
      valid: emails.filter((e) => !suppressedSet.has(e.toLowerCase())),
      suppressed: emails.filter((e) => suppressedSet.has(e.toLowerCase())),
    };
  } catch (error) {
    throw transformError(error);
  }
}
