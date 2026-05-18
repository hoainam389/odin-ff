export const IDS = ["A", "B", "C", "D", "E", "F", "G"] as const;
export type TeamId = (typeof IDS)[number];

export const DEFAULT_EMOJIS = ["🦅", "🐉", "🦁", "⚡", "🔥", "🌊", "🌙"];
export const DEFAULT_COLORS = [
  "#00d4ff",
  "#7c3aed",
  "#22c55e",
  "#f97316",
  "#ef4444",
  "#fbbf24",
  "#ec4899",
];

export const BASE_SCHEDULE: [TeamId, TeamId][] = [
  ["B", "G"], ["C", "F"], ["D", "E"], ["A", "G"], ["B", "E"], ["C", "D"], ["A", "F"],
  ["G", "E"], ["B", "C"], ["A", "E"], ["F", "D"], ["G", "C"], ["A", "D"], ["E", "C"],
  ["F", "B"], ["A", "C"], ["D", "B"], ["F", "G"], ["A", "B"], ["D", "G"], ["E", "F"],
];

export const TOTAL = BASE_SCHEDULE.length;

export function todayISO(): string {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
}

export function isWeekend(iso: string): boolean {
  const [y, m, d] = iso.split("-").map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d, 12)).getUTCDay();
  return dow === 0 || dow === 6;
}

export function isoOf(dt: Date): string {
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(dt.getUTCDate()).padStart(2, "0")}`;
}

export function addWorkdays(startISO: string, extraDays: number): string {
  const [y, m, d] = startISO.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12));
  let added = 0;
  while (added < extraDays) {
    dt.setUTCDate(dt.getUTCDate() + 1);
    if (![0, 6].includes(dt.getUTCDay())) added++;
  }
  return isoOf(dt);
}

/**
 * Match the prototype's generateDefaultDates: 3 per workday, skip weekends.
 */
export function generateDefaultDates(count: number, startISO: string): string[] {
  const dates: string[] = [];
  const [sy, sm, sd] = startISO.split("-").map(Number);
  const cur = new Date(Date.UTC(sy, sm - 1, sd, 12));
  while ([0, 6].includes(cur.getUTCDay())) cur.setUTCDate(cur.getUTCDate() + 1);
  let slot = 0;
  while (dates.length < count) {
    dates.push(isoOf(cur));
    slot++;
    if (slot >= 3) {
      slot = 0;
      cur.setUTCDate(cur.getUTCDate() + 1);
      while ([0, 6].includes(cur.getUTCDay())) cur.setUTCDate(cur.getUTCDate() + 1);
    }
  }
  return dates;
}

const DOW_SHORT = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const DOW_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTH_SHORT = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const MONTH_FULL = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function formatDateShort(iso: string): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  const dt = new Date(Date.UTC(+y, +m - 1, +d, 12));
  return `${DOW_SHORT[dt.getUTCDay()]} ${d}/${m}`;
}

export function formatDateFull(iso: string): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  const dt = new Date(Date.UTC(+y, +m - 1, +d, 12));
  return `${DOW_FULL[dt.getUTCDay()]}, ${d}/${m}/${y}`;
}

export function formatBannerDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  const dt = new Date(Date.UTC(+y, +m - 1, +d, 12));
  return `${MONTH_SHORT[dt.getUTCMonth()]} ${Number(d)} · ${DOW_SHORT[dt.getUTCDay()]}`;
}

export function formatMonthDay(iso: string): string {
  const [y, m, d] = iso.split("-");
  const dt = new Date(Date.UTC(+y, +m - 1, +d, 12));
  return `${MONTH_SHORT[dt.getUTCMonth()]} ${Number(d)}`;
}

export function formatHumanLong(iso: string): string {
  const [y, m, d] = iso.split("-");
  const dt = new Date(Date.UTC(+y, +m - 1, +d, 12));
  return `${MONTH_FULL[dt.getUTCMonth()]} ${Number(d)}, ${y}`;
}

/* ── Standings ─────────────────────────────────────────────────────────── */

export type RawRow = {
  teamId: string;
  p: number;
  w: number;
  d: number;
  l: number;
  gf: number;
  ga: number;
  y: number;
  r: number;
  played: number;
};

export type MatchInput = {
  homeTeam: string;
  awayTeam: string;
};

export type ResultInput = {
  scoreHome: number;
  scoreAway: number;
  yellowHome: number;
  yellowAway: number;
  redHome: number;
  redAway: number;
};

export function calcStandingsRaw(
  teamIds: string[],
  matchesWithResults: Array<{ match: MatchInput; result: ResultInput | null }>,
): Record<string, RawRow> {
  const s: Record<string, RawRow> = {};
  teamIds.forEach((id) => {
    s[id] = { teamId: id, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, y: 0, r: 0, played: 0 };
  });
  matchesWithResults.forEach(({ match, result }) => {
    if (!result) return;
    const a = match.homeTeam;
    const b = match.awayTeam;
    if (!s[a] || !s[b]) return;
    s[a].played++;
    s[b].played++;
    s[a].gf += result.scoreHome;
    s[a].ga += result.scoreAway;
    s[b].gf += result.scoreAway;
    s[b].ga += result.scoreHome;
    s[a].y += result.yellowHome;
    s[a].r += result.redHome;
    s[b].y += result.yellowAway;
    s[b].r += result.redAway;
    if (result.scoreHome > result.scoreAway) {
      s[a].p += 3;
      s[a].w++;
      s[b].l++;
    } else if (result.scoreAway > result.scoreHome) {
      s[b].p += 3;
      s[b].w++;
      s[a].l++;
    } else {
      s[a].p++;
      s[b].p++;
      s[a].d++;
      s[b].d++;
    }
  });
  return s;
}

export function sortStandings(raw: Record<string, RawRow>): RawRow[] {
  return Object.values(raw).sort(
    (x, y) =>
      y.p - x.p ||
      (y.gf - y.ga) - (x.gf - x.ga) ||
      y.gf - x.gf,
  );
}

/**
 * Fair play: team with lowest (yellow*1 + red*3) among teams with ≥1 match.
 * Returns teamId or null.
 */
export function fairplayLeader(raw: Record<string, RawRow>): string | null {
  const eligible = Object.values(raw).filter((v) => v.played > 0);
  if (!eligible.length) return null;
  const sorted = [...eligible].sort((a, b) => a.y + a.r * 3 - (b.y + b.r * 3));
  return sorted[0].teamId;
}

/* ── Auto schedule ─────────────────────────────────────────────────────── */

/**
 * Distribute pending matches (no result) over workdays starting today,
 * 3 per workday. Completed matches keep their date.
 *
 * Inputs are kept generic so this can run in server actions over DB rows.
 */
export function autoScheduleDates(
  matches: Array<{ id: number; matchDate: string; hasResult: boolean; displayOrder: number }>,
  today: string,
): Array<{ id: number; matchDate: string; displayOrder: number }> {
  const sorted = [...matches].sort((a, b) => a.displayOrder - b.displayOrder);
  const completed = sorted.filter((m) => m.hasResult);
  const pending = sorted.filter((m) => !m.hasResult);

  let baseDay = today;
  if (isWeekend(baseDay)) {
    const [y, m, d] = baseDay.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d, 12));
    while ([0, 6].includes(dt.getUTCDay())) dt.setUTCDate(dt.getUTCDate() + 1);
    baseDay = isoOf(dt);
  }

  const updates: Array<{ id: number; matchDate: string; displayOrder: number }> = [];

  pending.forEach((m, pos) => {
    const dayOffset = Math.floor(pos / 3);
    const newDate = dayOffset === 0 ? baseDay : addWorkdays(baseDay, dayOffset);
    updates.push({ id: m.id, matchDate: newDate, displayOrder: 0 });
  });

  // Re-sort completed by their existing date for stable ordering.
  completed.sort((a, b) => a.matchDate.localeCompare(b.matchDate));

  // displayOrder: completed first, then pending in their pending order.
  const finalOrder = [...completed.map((m) => m.id), ...pending.map((m) => m.id)];
  return finalOrder.map((id, order) => {
    const update = updates.find((u) => u.id === id);
    const date = update ? update.matchDate : completed.find((c) => c.id === id)!.matchDate;
    return { id, matchDate: date, displayOrder: order };
  });
}
