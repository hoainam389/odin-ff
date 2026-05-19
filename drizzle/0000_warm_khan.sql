-- ODIN Champion League — schema
-- Paste this entire block into Supabase SQL Editor and Run.
DO $migration$
BEGIN

  CREATE TABLE IF NOT EXISTS "teams" (
    "id"            text PRIMARY KEY NOT NULL,
    "name"          text NOT NULL,
    "emoji"         text NOT NULL,
    "color"         text NOT NULL,
    "display_order" integer NOT NULL
  );

  CREATE TABLE IF NOT EXISTS "matches" (
    "id"            serial PRIMARY KEY NOT NULL,
    "home_team"     text NOT NULL REFERENCES "teams"("id"),
    "away_team"     text NOT NULL REFERENCES "teams"("id"),
    "match_date"    date NOT NULL,
    "display_order" integer NOT NULL,
    "created_at"    timestamptz DEFAULT now() NOT NULL
  );

  CREATE TABLE IF NOT EXISTS "members" (
    "id"      serial PRIMARY KEY NOT NULL,
    "team_id" text NOT NULL REFERENCES "teams"("id") ON DELETE CASCADE,
    "name"    text NOT NULL
  );

  CREATE TABLE IF NOT EXISTS "results" (
    "match_id"    integer PRIMARY KEY REFERENCES "matches"("id") ON DELETE CASCADE,
    "score_home"  integer NOT NULL,
    "score_away"  integer NOT NULL,
    "yellow_home" integer DEFAULT 0 NOT NULL,
    "yellow_away" integer DEFAULT 0 NOT NULL,
    "red_home"    integer DEFAULT 0 NOT NULL,
    "red_away"    integer DEFAULT 0 NOT NULL,
    "updated_at"  timestamptz DEFAULT now() NOT NULL
  );

END
$migration$;
