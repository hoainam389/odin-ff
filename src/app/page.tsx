import { TopAppBar } from "@/components/TopAppBar";
import { Footer } from "@/components/Footer";
import { getLeague } from "@/lib/queries";
import { formatMonthDay, todayISO } from "@/lib/league";
import Link from "next/link";

// Skip prerender at build (DB unreachable from build runner); render on first
// request and let the CDN cache for ~30s via Cache-Control in middleware.
export const dynamic = "force-dynamic";

export default async function StandingsPage() {
  const league = await getLeague();
  const teamMap = Object.fromEntries(league.teams.map((t) => [t.id, t]));
  const today = todayISO();

  const ranked = league.standings;
  const top3 = ranked.slice(0, 3);
  const hasAnyPoints = top3.some((r) => r.p > 0);

  // All upcoming matches across every future date, sorted by date then displayOrder.
  const upcoming = league.matches
    .filter((m) => !m.result && m.matchDate >= today)
    .sort(
      (a, b) =>
        a.matchDate.localeCompare(b.matchDate) || a.displayOrder - b.displayOrder,
    );

  // Group upcoming matches by day for the sidebar.
  const upcomingByDay = new Map<string, typeof upcoming>();
  upcoming.forEach((m) => {
    const arr = upcomingByDay.get(m.matchDate) ?? [];
    arr.push(m);
    upcomingByDay.set(m.matchDate, arr);
  });
  const upcomingDays = Array.from(upcomingByDay.entries());

  // "Final whistle": last 4 completed matches by displayOrder desc
  const completed = league.matches
    .filter((m) => m.result)
    .sort((a, b) => b.displayOrder - a.displayOrder)
    .slice(0, 4);

  const fairplayTeam = league.fairplayId ? teamMap[league.fairplayId] : null;

  return (
    <>
      <TopAppBar active="standings" />
      <main className="flex-grow w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-8 flex flex-col gap-8">
        {/* Hero stats strip */}
        <section className="surface-1 rounded w-full overflow-hidden">
          <div className="grid grid-cols-2 md:grid-cols-5 divide-x divide-[#1F4D3F]">
            <Stat label="MATCHES PLAYED" value={league.stats.played} />
            <Stat label="GOALS" value={league.stats.goals} />
            <Stat label="YELLOW CARDS" value={league.stats.yellow} />
            <Stat label="RED CARDS" value={league.stats.red} valueClass="text-error" />
            <div className="p-4 flex flex-col items-center justify-center col-span-2 md:col-span-1 bg-[#101509]">
              <span className="text-label-caps font-label-caps text-on-surface-variant mb-1 text-center">
                FAIR PLAY LEADER
              </span>
              <span className="text-headline-md font-headline-md text-primary-fixed truncate w-full text-center uppercase">
                {fairplayTeam ? (
                  <>
                    <span style={{ color: fairplayTeam.color }}>{fairplayTeam.emoji}</span>{" "}
                    {fairplayTeam.name}
                  </>
                ) : (
                  "—"
                )}
              </span>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Standings + podium */}
          <section className="lg:col-span-8 flex flex-col gap-6">
            <div className="flex items-center gap-3 border-b border-[#1F4D3F] pb-4">
              <span className="text-primary-fixed text-3xl">🏆</span>
              <h2 className="text-display-md font-display-md text-primary-fixed m-0 leading-none">
                STANDINGS
              </h2>
            </div>

            {hasAnyPoints && (
              <div className="flex justify-center items-end gap-3 sm:gap-6 h-80 mt-4 mb-8">
                {top3[1] && (
                  <PodiumColumn
                    rank={2}
                    name={teamMap[top3[1].teamId]?.name ?? top3[1].teamId}
                    points={top3[1].p}
                    emoji={teamMap[top3[1].teamId]?.emoji ?? ""}
                    color={teamMap[top3[1].teamId]?.color ?? ""}
                  />
                )}
                {top3[0] && (
                  <PodiumColumn
                    rank={1}
                    name={teamMap[top3[0].teamId]?.name ?? top3[0].teamId}
                    points={top3[0].p}
                    emoji={teamMap[top3[0].teamId]?.emoji ?? ""}
                    color={teamMap[top3[0].teamId]?.color ?? ""}
                  />
                )}
                {top3[2] && (
                  <PodiumColumn
                    rank={3}
                    name={teamMap[top3[2].teamId]?.name ?? top3[2].teamId}
                    points={top3[2].p}
                    emoji={teamMap[top3[2].teamId]?.emoji ?? ""}
                    color={teamMap[top3[2].teamId]?.color ?? ""}
                  />
                )}
              </div>
            )}

            <div className="surface-1 rounded overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="border-b-2 border-[#1F4D3F] bg-[#071411]">
                    <Th className="w-12 text-center">#</Th>
                    <Th>TEAM</Th>
                    <Th className="text-center w-10">P</Th>
                    <Th className="text-center w-10">W</Th>
                    <Th className="text-center w-10">D</Th>
                    <Th className="text-center w-10">L</Th>
                    <Th className="text-center w-10 hidden sm:table-cell">GF</Th>
                    <Th className="text-center w-10 hidden sm:table-cell">GA</Th>
                    <Th className="text-center w-12">GD</Th>
                    <Th className="text-center w-10">🟨</Th>
                    <Th className="text-center w-10">🟥</Th>
                    <th className="p-3 font-label-caps text-label-caps text-primary-fixed text-center w-16">
                      PTS
                    </th>
                  </tr>
                </thead>
                <tbody className="font-body-md">
                  {ranked.map((row, idx) => {
                    const team = teamMap[row.teamId];
                    const gd = row.gf - row.ga;
                    const podiumColor =
                      idx === 0 ? "#FFD700" : idx === 1 ? "#c4c7c9" : idx === 2 ? "#CD7F32" : null;
                    return (
                      <tr
                        key={row.teamId}
                        className={`border-b border-[#1F4D3F] hover:bg-[#152A23] transition-colors group ${
                          idx % 2 === 1 ? "bg-[#071411]" : ""
                        }`}
                      >
                        <td className="p-3 text-center">
                          {podiumColor ? (
                            <div
                              className="w-6 h-6 text-[#101509] font-headline-md text-headline-md rounded-sm mx-auto flex items-center justify-center"
                              style={{ background: podiumColor }}
                            >
                              {idx + 1}
                            </div>
                          ) : (
                            <span className="text-on-surface-variant font-scoreboard-num text-xl">
                              {idx + 1}
                            </span>
                          )}
                        </td>
                        <td
                          className="p-3 font-bold flex items-center gap-2 border-l-2 ml-[1px]"
                          style={{ borderColor: podiumColor ?? "transparent" }}
                        >
                          <span
                            className="w-2 h-2 rounded-full inline-block"
                            style={{ background: team?.color ?? "#fff" }}
                          />
                          <span className="uppercase">{team?.name}</span>
                          <span style={{ color: team?.color }}>{team?.emoji}</span>
                        </td>
                        <Td>{row.played}</Td>
                        <Td>{row.w}</Td>
                        <Td>{row.d}</Td>
                        <Td>{row.l}</Td>
                        <Td className="hidden sm:table-cell">{row.gf}</Td>
                        <Td className="hidden sm:table-cell">{row.ga}</Td>
                        <Td className={gd > 0 ? "text-primary-fixed" : gd < 0 ? "text-accent-pink" : "text-on-surface-variant"}>
                          {gd > 0 ? `+${gd}` : gd}
                        </Td>
                        <td className="p-3 text-center text-on-surface-variant">{row.y}</td>
                        <td className={`p-3 text-center ${row.r > 0 ? "text-error font-bold" : "text-on-surface-variant"}`}>
                          {row.r}
                        </td>
                        <td className="p-0 text-center">
                          <div className="bg-primary-fixed text-[#101509] font-scoreboard-num text-2xl h-full w-full py-2 px-1 flex items-center justify-center">
                            {row.p}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Sidebar */}
          <aside className="lg:col-span-4 flex flex-col gap-6">
            <div className="surface-1 rounded p-4">
              <div className="flex items-center justify-between border-b border-[#1F4D3F] pb-3 mb-4">
                <h3 className="text-headline-md font-headline-md text-primary m-0 uppercase leading-none">
                  Next Matches
                </h3>
                <span className="text-label-caps font-label-caps text-on-surface-variant">
                  {upcoming.length} UPCOMING
                </span>
              </div>
              <div className="flex flex-col gap-4 max-h-[480px] overflow-y-auto pr-1 odin-scroll">
                {upcomingDays.length === 0 && (
                  <div className="text-on-surface-variant text-body-sm">No upcoming matches.</div>
                )}
                {upcomingDays.map(([date, items], dayIdx) => (
                  <div key={date} className="flex flex-col gap-2">
                    <div className="flex items-center justify-between sticky top-0 bg-[#0a1f1a] pb-1 z-10">
                      <span
                        className={`font-scoreboard-num text-base ${
                          dayIdx === 0 ? "text-primary-fixed" : "text-on-surface"
                        }`}
                      >
                        {formatMonthDay(date)}
                      </span>
                      <span className="text-[10px] font-label-caps text-on-surface-variant">
                        {items.length} {items.length === 1 ? "MATCH" : "MATCHES"}
                      </span>
                    </div>
                    {items.map((m) => (
                      <Link
                        key={m.id}
                        href={`/matches/${m.id}`}
                        className={`bg-[#071411] p-3 rounded flex justify-between items-center font-bold uppercase border-l-2 ${
                          dayIdx === 0 ? "border-primary-fixed" : "border-[#1F4D3F]"
                        } hover:bg-[#0c2620] transition-colors`}
                      >
                        <span>{teamMap[m.homeTeam]?.name ?? m.homeTeam}</span>
                        <span className="text-on-surface-variant font-label-caps text-[10px]">VS</span>
                        <span>{teamMap[m.awayTeam]?.name ?? m.awayTeam}</span>
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div className="surface-1 rounded p-4">
              <div className="flex items-center justify-between border-b border-[#1F4D3F] pb-3 mb-4">
                <h3 className="text-headline-md font-headline-md text-on-surface-variant m-0 uppercase leading-none">
                  Final Whistle
                </h3>
              </div>
              <div className="flex flex-col gap-2">
                {completed.length === 0 && (
                  <div className="text-on-surface-variant text-body-sm">No results yet.</div>
                )}
                {completed.map((m) => {
                  const r = m.result!;
                  const home = teamMap[m.homeTeam];
                  const away = teamMap[m.awayTeam];
                  const homeWin = r.scoreHome > r.scoreAway;
                  const awayWin = r.scoreAway > r.scoreHome;
                  return (
                    <Link
                      key={m.id}
                      href={`/matches/${m.id}`}
                      className="flex items-center justify-between p-2 hover:bg-[#152A23] rounded transition-colors"
                    >
                      <span className="font-label-caps text-on-surface-variant w-12">
                        {formatMonthDay(m.matchDate)}
                      </span>
                      <div className="flex-grow flex justify-center items-center gap-3 font-scoreboard-num text-xl leading-none">
                        <span className={homeWin ? "text-primary-fixed" : "text-on-surface-variant"}>
                          {home?.name.replace("Team ", "").toUpperCase()}
                        </span>
                        <div className="bg-[#071411] px-3 py-1 rounded flex items-center gap-2 border border-[#1F4D3F]">
                          <span className={homeWin ? "text-primary-fixed" : "text-on-surface-variant"}>
                            {r.scoreHome}
                          </span>
                          <span className="text-on-surface-variant text-sm">-</span>
                          <span className={awayWin ? "text-primary-fixed" : "text-on-surface-variant"}>
                            {r.scoreAway}
                          </span>
                        </div>
                        <span className={awayWin ? "text-primary-fixed" : "text-on-surface-variant"}>
                          {away?.name.replace("Team ", "").toUpperCase()}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </>
  );
}

function Stat({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: number;
  valueClass?: string;
}) {
  return (
    <div className="p-4 flex flex-col items-center justify-center">
      <span className="text-label-caps font-label-caps text-on-surface-variant mb-1">{label}</span>
      <span className={`text-scoreboard-num font-scoreboard-num text-primary ${valueClass ?? ""}`}>
        {value}
      </span>
    </div>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`p-3 font-label-caps text-label-caps text-on-surface-variant ${className}`}>
      {children}
    </th>
  );
}

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <td
      className={`p-3 text-center font-scoreboard-num text-xl leading-none ${className}`}
    >
      {children}
    </td>
  );
}

function PodiumColumn({
  rank,
  name,
  points,
  emoji,
  color,
}: {
  rank: 1 | 2 | 3;
  name: string;
  points: number;
  emoji: string;
  color: string;
}) {
  const isChamp = rank === 1;
  const heights = { 1: "h-full", 2: "h-[80%]", 3: "h-[68%]" } as const;
  const blockHeights = { 1: "h-32", 2: "h-20", 3: "h-16" } as const;
  const blockColors = {
    1: { ring: "#FFD700", text: "#FFD700", stand: "rgba(255,215,0,0.18)" },
    2: { ring: "#c4c7c9", text: "#c4c7c9", stand: "rgba(196,199,201,0.14)" },
    3: { ring: "#CD7F32", text: "#CD7F32", stand: "rgba(205,127,50,0.14)" },
  } as const;
  const medals = { 1: "🥇", 2: "🥈", 3: "🥉" } as const;
  const c = blockColors[rank];
  const avatarSize = isChamp
    ? "w-24 h-24 sm:w-28 sm:h-28 text-5xl"
    : rank === 2
      ? "w-20 h-20 text-3xl"
      : "w-16 h-16 text-2xl";
  const pointsClass = isChamp
    ? "text-scoreboard-num font-scoreboard-num text-5xl leading-none"
    : "text-scoreboard-num font-scoreboard-num text-2xl leading-none";

  return (
    <div className={`flex flex-1 max-w-[180px] flex-col items-center justify-end gap-2 ${heights[rank]}`}>
      {isChamp && <div className="text-3xl">👑</div>}
      <div
        className={`${avatarSize} rounded-full flex items-center justify-center bg-[#0a1f1a]`}
        style={{
          boxShadow: isChamp
            ? `0 0 0 3px ${c.ring}, 0 0 30px ${c.ring}55`
            : `0 0 0 2px ${c.ring}, 0 0 16px ${c.ring}33`,
          color,
        }}
      >
        <span style={{ filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.5))" }}>{emoji}</span>
      </div>
      <div
        className="text-center font-bold uppercase text-sm whitespace-normal leading-tight"
        style={{ color: c.text }}
      >
        {medals[rank]} {name}
      </div>
      <div className={pointsClass} style={{ color: c.text }}>
        {points}
        <span className="ml-1 text-label-caps font-label-caps text-on-surface-variant">PTS</span>
      </div>
      <div
        className={`w-full ${blockHeights[rank]} rounded-t-lg border-t border-x flex items-center justify-center font-display-md text-2xl`}
        style={{
          background: `linear-gradient(180deg, ${c.stand}, transparent)`,
          borderColor: `${c.ring}55`,
          color: c.text,
        }}
      >
        {rank}
      </div>
    </div>
  );
}
