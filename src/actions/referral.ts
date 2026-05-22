"use server";

import { revalidatePath } from "next/cache";
import { toggleReferralRedeemed } from "@/services/referral";
import { PositiveIntSchema } from "@/schema/common";
import { transformError } from "@/utils/errors";
import { requireAdmin } from "@/lib/dal";
import type { ActionResult } from "@/types/action";

export async function toggleRedeemed(id: number): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const validId = PositiveIntSchema.parse(id);
    await toggleReferralRedeemed(validId);
    console.error("[AUDIT] toggleRedeemed", session.ownerid, validId);
    revalidatePath("/referral-database");
    return { success: true };
  } catch (error) {
    const appError = transformError(error);
    return { success: false, error: appError.message };
  }
}
