import { env } from "@/env";

const FALLBACK_PRODUCTION = "https://pasofoodcooperative.coop/accounts/";
const FALLBACK_DEVELOPMENT = "/dev/mock-portal";

export function getPortalLoginUrl(): string {
  if (env.PRFC_PORTAL_LOGIN_URL) {
    return env.PRFC_PORTAL_LOGIN_URL;
  }
  if (env.NODE_ENV === "production") {
    return FALLBACK_PRODUCTION;
  }
  return FALLBACK_DEVELOPMENT;
}
