import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/dal";
import { validateOrigin } from "@/lib/csrf";
import { UpdateRedeemedSchema } from "@/schema/api";
import { StringIntSchema } from "@/schema/common";
import { updateReferralRedeemed, deleteReferral } from "@/services/referral";
import { apiErrorHandler } from "@/utils/errors";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin();

    if (!validateOrigin(req)) {
      return NextResponse.json({ error: { code: "FORBIDDEN", message: "Invalid origin" } }, { status: 403 });
    }

    const { id } = await params;
    const referralId = StringIntSchema.parse(id);
    const body = await req.json();
    const { redeemed } = UpdateRedeemedSchema.parse(body);

    const updated = await updateReferralRedeemed(referralId, redeemed);
    console.error("[AUDIT] updateReferralRedeemed", session.ownerid, referralId, redeemed);
    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    return apiErrorHandler(error);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin();

    if (!validateOrigin(req)) {
      return NextResponse.json({ error: { code: "FORBIDDEN", message: "Invalid origin" } }, { status: 403 });
    }

    const { id } = await params;
    const referralId = StringIntSchema.parse(id);
    await deleteReferral(referralId);
    console.error("[AUDIT] deleteReferral", session.ownerid, referralId);
    return NextResponse.json({ message: "Referral deleted" }, { status: 200 });
  } catch (error) {
    return apiErrorHandler(error);
  }
}
