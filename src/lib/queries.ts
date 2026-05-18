import "server-only";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { teams, matches, results, members } from "@/db/schema";
import {
  calcStandingsRaw,
  fairplayLeader,
  sortStandings,
  type RawRow,
} from "./league";

export async function getAllTeams() {
  return db.select().from(teams).orderBy(asc(teams.displayOrder));
}

export async function getAllMembers() {
  return db.select().from(members).orderBy(asc(members.id));
}

export type MatchWithResult = {
  id: number;
  homeTeam: string;
  awayTeam: string;
  matchDate: string;
  displayOrder: number;
  result: {
    scoreHome: number;
    scoreAway: number;
    yellowHome: number;
    yellowAway: number;
    redHome: number;
    redAway: number;
  } | null;
};

export async function getAllMatches(): Promise<MatchWithResult[]> {
  const rows = await db
    .select({
      id: matches.id,
      homeTeam: matches.homeTeam,
      awayTeam: matches.awayTeam,
      matchDate: matches.matchDate,
      displayOrder: matches.displayOrder,
      scoreHome: results.scoreHome,
      scoreAway: results.scoreAway,
      yellowHome: results.yellowHome,
      yellowAway: results.yellowAway,
      redHome: results.redHome,
      redAway: results.redAway,
    })
    .from(matches)
    .leftJoin(results, eq(results.matchId, matches.id))
    .orderBy(asc(matches.displayOrder));

  return rows.map((r) => ({
    id: r.id,
    homeTeam: r.homeTeam,
    awayTeam: r.awayTeam,
    matchDate: r.matchDate,
    displayOrder: r.displayOrder,
    result:
      r.scoreHome === null
        ? null
        : {
            scoreHome: r.scoreHome,
            scoreAway: r.scoreAway!,
            yellowHome: r.yellowHome!,
            yellowAway: r.yellowAway!,
            redHome: r.redHome!,
            redAway: r.redAway!,
          },
  }));
}

export async function getMatch(id: number): Promise<MatchWithResult | null> {
  const all = await getAllMatches();
  return all.find((m) => m.id === id) ?? null;
}

export type LeagueData = {
  teams: Awaited<ReturnType<typeof getAllTeams>>;
  matches: MatchWithResult[];
  standings: RawRow[];
  raw: Record<string, RawRow>;
  fairplayId: string | null;
  stats: {
    played: number;
    goals: number;
    yellow: number;
    red: number;
  };
};

export async function getLeague(): Promise<LeagueData> {
  const [teamsRows, matchesRows] = await Promise.all([getAllTeams(), getAllMatches()]);
  const raw = calcStandingsRaw(
    teamsRows.map((t) => t.id),
    matchesRows.map((m) => ({
      match: { homeTeam: m.homeTeam, awayTeam: m.awayTeam },
      result: m.result,
    })),
  );
  const standings = sortStandings(raw);

  let played = 0;
  let goals = 0;
  let yellow = 0;
  let red = 0;
  matchesRows.forEach((m) => {
    if (!m.result) return;
    played++;
    goals += m.result.scoreHome + m.result.scoreAway;
    yellow += m.result.yellowHome + m.result.yellowAway;
    red += m.result.redHome + m.result.redAway;
  });

  return {
    teams: teamsRows,
    matches: matchesRows,
    standings,
    raw,
    fairplayId: fairplayLeader(raw),
    stats: { played, goals, yellow, red },
  };
}
