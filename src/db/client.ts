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
    // Aggressive timeouts so a stuck pooler can't hang the whole function.
    connect_timeout: 5,
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
    msg.includes("CONNECTION_DESTROYED") ||
    msg.includes("CONNECT_TIMEOUT") ||
    msg.includes("timed out")
  );
}

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms),
    ),
  ]);
}

const DB_OP_TIMEOUT_MS = 6000;

/**
 * Run a DB op with a hard timeout. On a "Connection closed"-style failure or
 * a timeout, reset the pooled client and retry once with a fresh socket.
 * Caps total worst case at ~12s instead of the 60s function limit.
 */
export async function withDb<T>(op: () => Promise<T>): Promise<T> {
  try {
    return await withTimeout(op(), DB_OP_TIMEOUT_MS, "db.op");
  } catch (err) {
    if (!isStaleConnError(err)) throw err;
    await reset();
    return withTimeout(op(), DB_OP_TIMEOUT_MS, "db.op-retry");
  }
}

export { schema };
