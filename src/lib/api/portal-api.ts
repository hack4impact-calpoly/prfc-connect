import "server-only";
import { cookies } from "next/headers";
import { env } from "@/env";
import { AppError } from "@/utils/errors";
import {
  ListMembersResponseSchema,
  MemberContactsResponseSchema,
  ValidateTokenResponseSchema,
} from "@/schema/member-portal";
import type { Session } from "@/lib/dal";
import type { Member, MemberSummary } from "@/types/member";

export const PORTAL_TOKEN_COOKIE = "prfc_portal_token";

export async function getPortalToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(PORTAL_TOKEN_COOKIE)?.value ?? null;
}

const PORTAL_TIMEOUT_MS = 8000;

async function postForm(task: string, body: Record<string, string>): Promise<string> {
  let res: Response;
  try {
    res = await fetch(`${env.PRFC_PORTAL_API_URL}?task=${task}`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(body).toString(),
      signal: AbortSignal.timeout(PORTAL_TIMEOUT_MS),
    });
  } catch (error) {
    const name = error instanceof Error ? error.name : "";
    if (name === "TimeoutError" || name === "AbortError") {
      throw new AppError("INTERNAL_ERROR", `Member portal ${task} timed out after ${PORTAL_TIMEOUT_MS}ms`);
    }
    throw new AppError("INTERNAL_ERROR", `Member portal ${task} request failed`);
  }

  if (!res.ok) {
    throw new AppError("INTERNAL_ERROR", `Member portal ${task} responded ${res.status}`);
  }

  const text = await res.text();
  assertNoPortalError(text, task);
  return text;
}

function rawSnippet(raw: string): string {
  return raw.replace(/\s+/g, " ").trim().slice(0, 200);
}

function assertNoPortalError(raw: string, task: string): void {
  if (raw.includes("INVALID_KEY")) {
    throw new AppError("INTERNAL_ERROR", `Member portal ${task} rejected the request (invalid secret or token)`, {
      raw: rawSnippet(raw),
    });
  }
  if (/Undefined index|<b>\s*(Notice|Warning|Fatal error)\s*<\/b>/i.test(raw)) {
    throw new AppError("INTERNAL_ERROR", `Member portal ${task} returned a server error`, { raw: rawSnippet(raw) });
  }
}

function extractObject(raw: string): unknown {
  const stripped = raw.replace(/<[^>]+>/g, "");
  const start = stripped.indexOf("{");
  const end = stripped.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new AppError("INTERNAL_ERROR", "Member portal returned no JSON object", { raw: rawSnippet(raw) });
  }
  try {
    return JSON.parse(stripped.slice(start, end + 1));
  } catch {
    throw new AppError("INTERNAL_ERROR", "Member portal returned an unparseable JSON object", { raw: rawSnippet(raw) });
  }
}

function extractArray(raw: string): unknown {
  const start = raw.indexOf("[");
  const end = raw.lastIndexOf("]");
  if (start === -1 || end === -1) {
    throw new AppError("INTERNAL_ERROR", "Member portal returned no JSON array", { raw: rawSnippet(raw) });
  }
  const body = raw
    .slice(start, end + 1)
    .replace(/<[^>]+>/g, "")
    .replace(/}\s*{/g, "},{")
    .replace(/,\s*]/g, "]");
  try {
    return JSON.parse(body);
  } catch {
    throw new AppError("INTERNAL_ERROR", "Member portal returned an unparseable JSON array", { raw: rawSnippet(raw) });
  }
}

export async function validatePortalToken(token: string): Promise<Session | null> {
  let raw: string;
  try {
    raw = await postForm("validatetoken", { token });
  } catch (error) {
    console.warn("[PORTAL] validatetoken request failed", error instanceof Error ? error.message : error);
    return null;
  }

  let parsed;
  try {
    parsed = ValidateTokenResponseSchema.safeParse(extractObject(raw));
  } catch (error) {
    console.warn(
      "[PORTAL] validatetoken returned an unparseable response",
      error instanceof Error ? error.message : error,
    );
    return null;
  }
  if (!parsed.success) return null;

  const ownerid = Number(parsed.data.ownerid);
  if (!Number.isInteger(ownerid) || ownerid <= 0) return null;
  if (Number(parsed.data.secondsleft) <= 0) return null;

  return { ownerid, isAdmin: parsed.data.isadmin === "1" };
}

export async function fetchListMembers(token: string): Promise<MemberSummary[]> {
  const raw = await postForm("listmembers", { token });
  const data = ListMembersResponseSchema.parse(extractArray(raw));
  return data.map((m) => ({ ownerid: Number(m.ownerid), ownername: m.ownername }));
}

export async function fetchMemberContacts(ownerids: number[]): Promise<Member[]> {
  if (ownerids.length === 0) return [];

  const raw = await postForm("getmembercontacts", {
    secret: env.MEMBER_API_SECRET ?? "",
    ownerids: ownerids.join(","),
  });
  const data = MemberContactsResponseSchema.parse(extractArray(raw));
  return data.map((m) => ({
    ownerid: Number(m.ownerid),
    ownername: m.ownername,
    owneremail: m.email,
    ownerphone: m.phone,
    owneraltphone: m.altphone === "" ? undefined : m.altphone,
  }));
}
