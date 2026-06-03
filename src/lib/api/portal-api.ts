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

async function postForm(task: string, body: Record<string, string>): Promise<string> {
  const res = await fetch(`${env.PRFC_PORTAL_API_URL}?task=${task}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body).toString(),
  });

  if (!res.ok) {
    throw new AppError("INTERNAL_ERROR", `Member portal ${task} responded ${res.status}`);
  }

  return res.text();
}

function extractObject(raw: string): unknown {
  const stripped = raw.replace(/<[^>]+>/g, "");
  const start = stripped.indexOf("{");
  const end = stripped.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new AppError("INTERNAL_ERROR", "Member portal returned no JSON object");
  }
  return JSON.parse(stripped.slice(start, end + 1));
}

function extractArray(raw: string): unknown {
  const start = raw.indexOf("[");
  const end = raw.lastIndexOf("]");
  if (start === -1 || end === -1) {
    throw new AppError("INTERNAL_ERROR", "Member portal returned no JSON array");
  }
  const body = raw
    .slice(start, end + 1)
    .replace(/<[^>]+>/g, "")
    .replace(/}\s*{/g, "},{")
    .replace(/,\s*]/g, "]");
  return JSON.parse(body);
}

export async function validatePortalToken(token: string): Promise<Session | null> {
  let raw: string;
  try {
    raw = await postForm("validatetoken", { token });
  } catch {
    return null;
  }

  let parsed;
  try {
    parsed = ValidateTokenResponseSchema.safeParse(extractObject(raw));
  } catch {
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
