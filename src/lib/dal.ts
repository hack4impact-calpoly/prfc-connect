import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";
import { AppError } from "@/utils/errors";
import { getMemberById } from "@/lib/api/member-api";

export const AUTH_COOKIE = "prfc_auth";
const TOKEN_EXPIRY_MS = 3600000;
const DEV_SECRET = "dev-only-prfc-connect-hmac-secret-32ch";

export function getSecret(): string {
  const secret = process.env.PRFC_PORTAL_SECRET;
  if (secret) return secret;

  if (process.env.NODE_ENV === "production") {
    throw new AppError("INTERNAL_ERROR", "PRFC_PORTAL_SECRET required in production");
  }

  return DEV_SECRET;
}

export interface Session {
  ownerid: number;
  isAdmin: boolean;
}

export interface SessionWithName extends Session {
  ownername: string;
}

function verifyHmac(payload: string, signature: string, secret: string): boolean {
  if (signature.length !== 8) return false;

  const expected = createHmac("sha256", secret).update(payload).digest("hex").slice(0, 8);

  return timingSafeEqual(Buffer.from(signature, "utf8"), Buffer.from(expected, "utf8"));
}

export function validateToken(token: string, secret: string): Session | null {
  const parts = token.split("|");
  if (parts.length !== 4) return null;

  const [ownerid, isAdmin, timestamp, signature] = parts;
  if (!ownerid || !isAdmin || !timestamp || !signature) return null;

  const payload = `${ownerid}|${isAdmin}|${timestamp}`;
  if (!verifyHmac(payload, signature, secret)) return null;

  const tokenTime = parseInt(timestamp, 10);
  if (isNaN(tokenTime) || tokenTime > Date.now() || Date.now() - tokenTime > TOKEN_EXPIRY_MS) return null;

  const parsedOwnerId = parseInt(ownerid, 10);
  if (isNaN(parsedOwnerId) || parsedOwnerId <= 0) return null;

  return {
    ownerid: parsedOwnerId,
    isAdmin: isAdmin === "1",
  };
}

export const verifySession = cache(async (): Promise<Session> => {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get(AUTH_COOKIE);

  if (!authCookie?.value) {
    throw new AppError("UNAUTHORIZED", "Authentication required");
  }

  const session = validateToken(authCookie.value, getSecret());
  if (!session) {
    throw new AppError("UNAUTHORIZED", "Invalid or expired token");
  }

  return session;
});

export const getSession = cache(async (): Promise<Session | null> => {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get(AUTH_COOKIE);

  if (!authCookie?.value) {
    return null;
  }

  return validateToken(authCookie.value, getSecret());
});

export const getSessionWithName = cache(async (): Promise<SessionWithName> => {
  const session = await verifySession();
  const member = await getMemberById(session.ownerid);
  return { ...session, ownername: member?.ownername ?? "Member" };
});

export async function requireAdmin(): Promise<Session> {
  const session = await verifySession();
  if (!session.isAdmin) {
    throw new AppError("FORBIDDEN", "Admin access required");
  }
  return session;
}

export function generateToken(ownerid: number, isAdmin: boolean): string {
  const timestamp = Date.now().toString();
  const payload = `${ownerid}|${isAdmin ? "1" : "0"}|${timestamp}`;
  const signature = createHmac("sha256", getSecret()).update(payload).digest("hex").slice(0, 8);
  return `${payload}|${signature}`;
}
