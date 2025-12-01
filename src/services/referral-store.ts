import prisma from "@/database/db";
import { CreateReferralSchema, type CreateReferral } from "@/schema/referral";
import { AppError, transformError } from "@/utils/errors";

export async function getAllReferrals() {
  try {
    return await prisma.referral.findMany({
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    throw transformError(error);
  }
}

export async function getReferralById(id: number) {
  try {
    const referral = await prisma.referral.findUnique({ where: { id } });

    if (!referral) {
      throw new AppError("NOT_FOUND", `Referral with id ${id} not found`);
    }

    return referral;
  } catch (error) {
    throw transformError(error);
  }
}

export async function createReferral(data: CreateReferral) {
  try {
    const validated = CreateReferralSchema.parse(data);

    return await prisma.referral.create({
      data: {
        memberName: validated.memberName,
        memberEmail: validated.memberEmail,
        prospectName: validated.prospectName,
        prospectEmail: validated.prospectEmail,
        referralCode: validated.referralCode,
        redeemed: validated.redeemed ?? false,
      },
    });
  } catch (error) {
    throw transformError(error);
  }
}

export async function createManyReferrals(referrals: CreateReferral[]) {
  try {
    const validatedReferrals = referrals.map((data) => CreateReferralSchema.parse(data));

    return await prisma.$transaction(
      validatedReferrals.map((data) =>
        prisma.referral.create({
          data: {
            memberName: data.memberName,
            memberEmail: data.memberEmail,
            prospectName: data.prospectName,
            prospectEmail: data.prospectEmail,
            referralCode: data.referralCode,
            redeemed: data.redeemed ?? false,
          },
        }),
      ),
    );
  } catch (error) {
    throw transformError(error);
  }
}

export async function toggleReferralRedeemed(id: number) {
  try {
    const existing = await prisma.referral.findUnique({ where: { id } });

    if (!existing) {
      throw new AppError("NOT_FOUND", `Referral with id ${id} not found`);
    }

    return await prisma.referral.update({
      where: { id },
      data: { redeemed: !existing.redeemed },
    });
  } catch (error) {
    throw transformError(error);
  }
}

export async function updateReferralRedeemed(id: number, redeemed: boolean) {
  try {
    return await prisma.referral.update({
      where: { id },
      data: { redeemed },
    });
  } catch (error) {
    throw transformError(error);
  }
}
