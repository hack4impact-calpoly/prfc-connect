import "server-only";

import { env } from "@/env";

const FALLBACK_PORTAL_URL = "https://pasofoodcooperative.coop/accounts/";

export function getPortalLoginUrl(): string {
  return env.PRFC_PORTAL_LOGIN_URL ?? FALLBACK_PORTAL_URL;
}
