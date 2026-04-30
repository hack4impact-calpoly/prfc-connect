"use server";

import { verifySession } from "@/lib/dal";
import { getRecentActivity, markNotificationsSeen } from "@/services/dashboard";
import { transformError } from "@/utils/errors";
import type { ActionResult } from "@/types/action";
import type { ActivityItem } from "@/types/dashboard";

export async function fetchRecentActivity(): Promise<ActionResult<ActivityItem[]>> {
  try {
    const session = await verifySession();
    const items = await getRecentActivity(session.ownerid, 5);
    return { success: true, data: items };
  } catch (error) {
    const appError = transformError(error);
    return { success: false, error: appError.message };
  }
}

export async function markNotificationsAsSeen(): Promise<ActionResult> {
  try {
    const session = await verifySession();
    await markNotificationsSeen(session.ownerid);
    return { success: true };
  } catch (error) {
    const appError = transformError(error);
    return { success: false, error: appError.message };
  }
}
