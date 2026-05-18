import {
  pgTable,
  text,
  integer,
  serial,
  date,
  timestamp,
  primaryKey,
} from "drizzle-orm/pg-core";

export const teams = pgTable("teams", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  emoji: text("emoji").notNull(),
  color: text("color").notNull(),
  displayOrder: integer("display_order").notNull(),
});

export const members = pgTable("members", {
  id: serial("id").primaryKey(),
  teamId: text("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
});

export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  homeTeam: text("home_team")
    .notNull()
    .references(() => teams.id),
  awayTeam: text("away_team")
    .notNull()
    .references(() => teams.id),
  matchDate: date("match_date").notNull(),
  displayOrder: integer("display_order").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const results = pgTable(
  "results",
  {
    matchId: integer("match_id")
      .primaryKey()
      .references(() => matches.id, { onDelete: "cascade" }),
    scoreHome: integer("score_home").notNull(),
    scoreAway: integer("score_away").notNull(),
    yellowHome: integer("yellow_home").notNull().default(0),
    yellowAway: integer("yellow_away").notNull().default(0),
    redHome: integer("red_home").notNull().default(0),
    redAway: integer("red_away").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
);

export type Team = typeof teams.$inferSelect;
export type Member = typeof members.$inferSelect;
export type Match = typeof matches.$inferSelect;
export type Result = typeof results.$inferSelect;
