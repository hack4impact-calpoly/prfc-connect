import "server-only";
import { NextRequest } from "next/server";

export function validateOrigin(req: NextRequest): boolean {
  const secFetchSite = req.headers.get("sec-fetch-site");
  if (secFetchSite === "cross-site") return false;
  if (secFetchSite === "same-origin" || secFetchSite === "same-site") return true;

  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (!origin || !host) return false;

  return origin === `https://${host}` || origin === `http://${host}`;
}
