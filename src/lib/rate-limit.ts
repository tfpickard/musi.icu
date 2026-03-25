import { Redis } from "@upstash/redis";

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

type StoredCounter = {
  count: number;
  resetAt: number;
};

const memoryStore = new Map<string, StoredCounter>();
let redis: Redis | null = null;

function nowSeconds() {
  return Math.floor(Date.now() / 1000);
}

function getRedisConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.VERCEL_KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.VERCEL_KV_REST_API_TOKEN;

  if (!url || !token) {
    return null;
  }

  return { url, token };
}

function getRedisClient() {
  const config = getRedisConfig();

  if (!config) {
    return null;
  }

  if (!redis) {
    redis = new Redis(config);
  }

  return redis;
}

export async function consumeRateLimit(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
  const resetAt = nowSeconds() + windowSeconds;
  const redisClient = getRedisClient();

  if (redisClient) {
    const count = await redisClient.incr(key);

    if (count === 1) {
      await redisClient.expire(key, windowSeconds);
    }

    return {
      allowed: count <= limit,
      remaining: Math.max(limit - count, 0),
      resetAt,
    };
  }

  const existing = memoryStore.get(key);
  const now = nowSeconds();

  if (!existing || existing.resetAt <= now) {
    memoryStore.set(key, {
      count: 1,
      resetAt,
    });

    return {
      allowed: true,
      remaining: limit - 1,
      resetAt,
    };
  }

  existing.count += 1;
  memoryStore.set(key, existing);

  return {
    allowed: existing.count <= limit,
    remaining: Math.max(limit - existing.count, 0),
    resetAt: existing.resetAt,
  };
}

export function getRequestIp(headers: Headers) {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }

  return headers.get("x-real-ip") ?? "unknown";
}
