import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres, { type Sql } from "postgres";
import * as schema from "./schema";

let _sql: Sql | null = null;
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

function getDb() {
  if (_db) return _db;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  _sql = postgres(url, {
    prepare: false,
    max: 1,
    idle_timeout: 1,
    max_lifetime: 20,
    connect_timeout: 8,
    onnotice: () => {},
  });
  _db = drizzle(_sql, { schema });
  return _db;
}

export const db: ReturnType<typeof drizzle<typeof schema>> = new Proxy({} as never, {
  get(_target, prop) {
    return (getDb() as unknown as Record<string, unknown>)[prop as string];
  },
});

/**
 * Drop the cached client so the next query opens a fresh socket.
 * Used by the retry helper below — the pgBouncer-style pooler may have
 * silently closed our idle connection between requests.
 */
async function reset() {
  const s = _sql;
  _sql = null;
  _db = null;
  if (s) {
    try {
      await s.end({ timeout: 1 });
    } catch {
      // ignore
    }
  }
}

function isStaleConnError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes("Connection closed") ||
    msg.includes("CONNECTION_CLOSED") ||
    msg.includes("CONNECTION_ENDED") ||
    msg.includes("CONNECTION_DESTROYED")
  );
}

/**
 * Run a DB op once, and on a "Connection closed"-style failure, reset the
 * pooled client and retry once. This is the standard pgBouncer + serverless
 * recovery pattern.
 */
export async function withDb<T>(op: () => Promise<T>): Promise<T> {
  try {
    return await op();
  } catch (err) {
    if (!isStaleConnError(err)) throw err;
    await reset();
    return op();
  }
}

export { schema };
