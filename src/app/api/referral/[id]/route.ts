import { NextRequest, NextResponse } from "next/server";
import { toggleReferralRedeemed } from "@/services/referral-store";
import { AppError, apiErrorHandler } from "@/utils/errors";

export async function PUT(req: NextRequest, context: { params: Promise<{ id?: string }> }) {
  try {
    const resolvedParams = await context.params;
    if (!resolvedParams?.id) {
      throw new AppError("VALIDATION_ERROR", "Invalid referral ID");
    }

    const referralId = parseInt(resolvedParams.id, 10);
    if (isNaN(referralId)) {
      throw new AppError("VALIDATION_ERROR", "Invalid referral ID");
    }

    const updatedReferral = await toggleReferralRedeemed(referralId);

    return NextResponse.json({ message: "Referral updated successfully!", referral: updatedReferral }, { status: 200 });
  } catch (error) {
    return apiErrorHandler(error);
  }
}
