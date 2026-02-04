import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { env } from "@/env";

type RateLimitConfig = {
  prefix: string;
  limit: number;
  window: string;
};

export function createRateLimiter(config: RateLimitConfig) {
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }

  const redis = new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  });

  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(config.limit, config.window as Parameters<typeof Ratelimit.slidingWindow>[1]),
    prefix: config.prefix,
  });
}

export const rateLimiter = createRateLimiter({ prefix: "prfc:referral", limit: 5, window: "60 s" });

export const membersRateLimiter = createRateLimiter({ prefix: "prfc:members", limit: 10, window: "60 s" });
