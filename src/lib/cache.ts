import "server-only";
import { Redis } from "@upstash/redis";

let _redis: Redis | null = null;

function getRedis(): Redis | null {
  if (_redis) return _redis;
  // Upstash Redis from Vercel Marketplace exposes one of these env-var sets.
  // Try them in order so the same code works locally and in prod.
  const url =
    process.env.KV_REST_API_URL ??
    process.env.UPSTASH_REDIS_REST_URL ??
    process.env.REDIS_URL;
  const token =
    process.env.KV_REST_API_TOKEN ??
    process.env.UPSTASH_REDIS_REST_TOKEN ??
    process.env.REDIS_TOKEN;
  if (!url || !token) return null;
  _redis = new Redis({ url, token });
  return _redis;
}

/**
 * Read-through cache: serves the cached value if present, otherwise runs `op`,
 * stores its result under `key` with the given TTL, and returns the fresh value.
 * If Redis isn't configured, `op` runs directly with no caching.
 */
export async function cached<T>(
  key: string,
  ttlSeconds: number,
  op: () => Promise<T>,
): Promise<T> {
  const r = getRedis();
  if (!r) return op();
  try {
    const hit = await r.get<T>(key);
    if (hit !== null && hit !== undefined) return hit;
  } catch {
    // ignore cache read failures — never let cache infra take down the page
  }
  const fresh = await op();
  try {
    await r.set(key, fresh, { ex: ttlSeconds });
  } catch {
    // ignore cache write failures
  }
  return fresh;
}

/** Invalidate one or more cache keys. Safe if Redis isn't configured. */
export async function invalidate(...keys: string[]): Promise<void> {
  const r = getRedis();
  if (!r || keys.length === 0) return;
  try {
    await r.del(...keys);
  } catch {
    // ignore
  }
}

export const CACHE_KEYS = {
  league: "league:v1",
  teams: "teams:v1",
  matches: "matches:v1",
  members: "members:v1",
} as const;
