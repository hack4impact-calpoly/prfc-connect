import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/dal";
import { UpdateRedeemedSchema } from "@/schema/api";
import { updateReferralRedeemed, deleteReferral } from "@/services/referral";
import { AppError, apiErrorHandler } from "@/utils/errors";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await verifySession();

    const { id } = await params;
    if (!/^\d+$/.test(id)) {
      throw new AppError("VALIDATION_ERROR", "Invalid referral ID format");
    }

    const referralId = parseInt(id, 10);
    const body = await req.json();
    const { redeemed } = UpdateRedeemedSchema.parse(body);

    const updated = await updateReferralRedeemed(referralId, redeemed);
    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    return apiErrorHandler(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await verifySession();

    const { id } = await params;
    if (!/^\d+$/.test(id)) {
      throw new AppError("VALIDATION_ERROR", "Invalid referral ID format");
    }

    const referralId = parseInt(id, 10);
    await deleteReferral(referralId);
    return NextResponse.json({ message: "Referral deleted" }, { status: 200 });
  } catch (error) {
    return apiErrorHandler(error);
  }
}
