import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { teams, matches, members, results } from "./schema";
import {
  IDS,
  DEFAULT_EMOJIS,
  DEFAULT_COLORS,
  BASE_SCHEDULE,
  generateDefaultDates,
} from "../lib/league";

const SEED_NAMES: Record<string, string> = {
  A: "Team Alpha",
  B: "Team Beta",
  C: "Team Cobra",
  D: "Team Delta",
  E: "Team Eagle",
  F: "Team Fenix",
  G: "Team Ghost",
};

async function main() {
  const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL or DIRECT_URL must be set");
  const sql = postgres(url, { prepare: false, max: 1 });
  const db = drizzle(sql);

  console.log("Clearing existing data…");
  await db.delete(results);
  await db.delete(matches);
  await db.delete(members);
  await db.delete(teams);

  console.log("Seeding teams…");
  await db.insert(teams).values(
    IDS.map((id, i) => ({
      id,
      name: SEED_NAMES[id],
      emoji: DEFAULT_EMOJIS[i],
      color: DEFAULT_COLORS[i],
      displayOrder: i,
    })),
  );

  console.log("Seeding members…");
  await db.insert(members).values(
    IDS.flatMap((id, i) => [
      { teamId: id, name: `Player ${i * 2 + 1}` },
      { teamId: id, name: `Player ${i * 2 + 2}` },
    ]),
  );

  console.log("Seeding 21-match round-robin…");
  const dates = generateDefaultDates(BASE_SCHEDULE.length, "2026-05-18");
  await db.insert(matches).values(
    BASE_SCHEDULE.map((pair, i) => ({
      homeTeam: pair[0],
      awayTeam: pair[1],
      matchDate: dates[i],
      displayOrder: i,
    })),
  );

  console.log("Done.");
  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
