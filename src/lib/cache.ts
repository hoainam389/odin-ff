import "server-only";
import { Redis } from "@upstash/redis";

let _redis: Redis | null = null;

function getRedis(): Redis | null {
  if (_redis) return _redis;
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
 * Race a promise against a timeout. Used to bound the time we'll wait on
 * external infra (Redis, Postgres) so a stuck connection can't burn the
 * entire serverless function budget.
 */
function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms),
    ),
  ]);
}

const REDIS_TIMEOUT_MS = 1500;

/**
 * Read-through cache: serves the cached value if present, otherwise runs `op`,
 * stores its result under `key` with the given TTL, and returns the fresh value.
 * If Redis isn't configured, or any cache call hangs/errors, falls back to `op`.
 */
export async function cached<T>(
  key: string,
  ttlSeconds: number,
  op: () => Promise<T>,
): Promise<T> {
  const r = getRedis();
  if (!r) return op();
  try {
    const hit = await withTimeout(r.get<T>(key), REDIS_TIMEOUT_MS, "redis.get");
    if (hit !== null && hit !== undefined) return hit;
  } catch {
    // ignore cache read failures — fall through to DB
  }
  const fresh = await op();
  // Fire-and-forget the write so a slow Upstash doesn't slow down the response.
  withTimeout(r.set(key, fresh, { ex: ttlSeconds }), REDIS_TIMEOUT_MS, "redis.set").catch(
    () => {},
  );
  return fresh;
}

/** Invalidate one or more cache keys. Safe if Redis isn't configured. */
export async function invalidate(...keys: string[]): Promise<void> {
  const r = getRedis();
  if (!r || keys.length === 0) return;
  try {
    await withTimeout(r.del(...keys), REDIS_TIMEOUT_MS, "redis.del");
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
