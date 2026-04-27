"use server";

import { verifySession } from "@/lib/dal";
import { getMemberProfile } from "@/services/profile";
import { transformError } from "@/utils/errors";
import type { ActionResult } from "@/types/action";
import type { MemberProfile } from "@/services/profile";

export async function fetchProfile(): Promise<ActionResult<MemberProfile>> {
  try {
    const session = await verifySession();
    const profile = await getMemberProfile(session.ownerid, session.isAdmin);
    return { success: true, data: profile };
  } catch (error) {
    const appError = transformError(error);
    return { success: false, error: appError.message };
  }
}
