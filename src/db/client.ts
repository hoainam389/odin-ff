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
    // Vercel functions are short-lived; pooling within an instance is a trap
    // because the upstream pooler closes idle conns without us noticing.
    max: 1,
    idle_timeout: 4,
    max_lifetime: 30,
    connect_timeout: 8,
  });
  _db = drizzle(_sql, { schema });
  return _db;
}

// Lazy proxy so that simply importing `db` at module top-level doesn't
// require DATABASE_URL — only using it does. This keeps `next build` from
// failing on environments that don't expose secrets at build time.
export const db: ReturnType<typeof drizzle<typeof schema>> = new Proxy({} as any, {
  get(_target, prop) {
    return (getDb() as any)[prop];
  },
});

export { schema };
