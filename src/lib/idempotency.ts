import "server-only";
import { Redis } from "@upstash/redis";

const IDEMPOTENCY_TTL = 86400; // 24 hours in seconds

interface CachedResponse {
  status: number;
  body: unknown;
}

function createIdempotencyStore() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }

  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

const redis = createIdempotencyStore();

export async function getIdempotentResponse(key: string): Promise<CachedResponse | null> {
  if (!redis || !key) return null;

  const cached = await redis.get<CachedResponse>(`idempotency:${key}`);
  return cached;
}

export async function setIdempotentResponse(key: string, status: number, body: unknown): Promise<void> {
  if (!redis || !key) return;

  await redis.set(`idempotency:${key}`, { status, body }, { ex: IDEMPOTENCY_TTL });
}
