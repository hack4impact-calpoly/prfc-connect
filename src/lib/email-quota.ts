import "server-only";
import { Redis } from "@upstash/redis";
import { env } from "@/env";

let _redis: Redis | null = null;

function getRedis(): Redis | null {
  if (_redis) return _redis;
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) return null;
  _redis = new Redis({ url: env.UPSTASH_REDIS_REST_URL, token: env.UPSTASH_REDIS_REST_TOKEN });
  return _redis;
}

function todayKey(): string {
  return `prfc:email-sent:${new Date().toISOString().slice(0, 10)}`;
}

export async function reserveEmailQuota(count: number): Promise<{ allowed: number; total: number }> {
  const redis = getRedis();
  if (!redis) {
    return { allowed: count, total: count };
  }

  const key = todayKey();
  const total = await redis.incrby(key, count);

  if (total <= env.DAILY_EMAIL_LIMIT) {
    await redis.expire(key, 172800);
    return { allowed: count, total };
  }

  const excess = total - env.DAILY_EMAIL_LIMIT;
  const allowed = Math.max(0, count - excess);
  if (excess > 0) {
    await redis.decrby(key, excess);
  }
  await redis.expire(key, 172800);
  return { allowed, total: env.DAILY_EMAIL_LIMIT };
}
