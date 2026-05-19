import Link from "next/link";
import { TopAppBar } from "@/components/TopAppBar";
import { Footer } from "@/components/Footer";
import { getLeague } from "@/lib/queries";
import { formatBannerDate, todayISO } from "@/lib/league";

export const revalidate = 30;

type SearchParams = Promise<{ filter?: string }>;

export default async function FixturesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { filter = "all" } = await searchParams;
  const league = await getLeague();
  const teamMap = Object.fromEntries(league.teams.map((t) => [t.id, t]));
  const today = todayISO();

  const filtered = league.matches.filter((m) => {
    if (filter === "completed") return !!m.result;
    if (filter === "upcoming") return !m.result && m.matchDate >= today;
    if (filter === "today") return m.matchDate === today;
    return true;
  });

  // group by date preserving displayOrder
  const groups = new Map<string, typeof filtered>();
  filtered
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .forEach((m) => {
      const arr = groups.get(m.matchDate) ?? [];
      arr.push(m);
      groups.set(m.matchDate, arr);
    });

  const dates = Array.from(groups.keys()).sort();

  return (
    <>
      <TopAppBar active="fixtures" />
      <section className="w-full bg-[#071411] border-b border-[#1F4D3F] pt-6 pb-4">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop flex flex-col md:flex-row justify-between items-end gap-4">
          <div>
            <h2 className="text-display-md font-display-md text-primary-fixed-dim mb-1">FIXTURES</h2>
            <p className="text-label-caps font-label-caps text-on-surface-variant">
              {league.matches.length} MATCHES · {league.teams.length} TEAMS · ROUND-ROBIN
            </p>
          </div>
          <nav className="flex flex-wrap gap-2">
            {[
              { key: "all", label: "ALL" },
              { key: "completed", label: "COMPLETED" },
              { key: "upcoming", label: "UPCOMING" },
              { key: "today", label: "TODAY" },
            ].map((p) => {
              const active = p.key === filter;
              const href = p.key === "all" ? "/fixtures" : `/fixtures?filter=${p.key}`;
              return (
                <Link
                  key={p.key}
                  href={href}
                  className={
                    active
                      ? "px-4 py-2 bg-primary-fixed-dim text-[#050807] text-label-caps font-label-caps rounded font-bold"
                      : "px-4 py-2 surface-1 text-on-surface-variant text-label-caps font-label-caps rounded hover:text-primary-fixed-dim transition-colors"
                  }
                >
                  {p.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </section>
      <main className="flex-grow w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-8 flex flex-col gap-6">
        {dates.length === 0 && (
          <div className="text-on-surface-variant text-center py-12">No matches.</div>
        )}
        {dates.map((date) => {
          const items = groups.get(date)!;
          const completedCount = items.filter((m) => m.result).length;
          const isToday = date === today;
          const isPast = date < today;
          return (
            <div key={date} className="flex flex-col gap-unit">
              <div className="w-full bg-black scanline-header border border-[#1F4D3F] p-3 flex justify-between items-center rounded-sm">
                <div className="flex items-center gap-3">
                  <span
                    className={`text-headline-md font-headline-md uppercase ${
                      isToday ? "text-primary-fixed-dim" : "text-on-surface"
                    }`}
                  >
                    {formatBannerDate(date)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {isToday && (
                    <span className="bg-primary-fixed-dim text-[#050807] px-2 py-0.5 text-label-caps font-label-caps rounded-sm">
                      TODAY
                    </span>
                  )}
                  {isPast && !isToday && (
                    <span className="bg-surface-variant text-on-surface-variant px-2 py-0.5 text-label-caps font-label-caps rounded-sm">
                      PAST
                    </span>
                  )}
                  <span className="text-label-caps font-label-caps text-on-surface-variant">
                    {completedCount} / {items.length} PLAYED
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {items.map((m) => {
                  const home = teamMap[m.homeTeam];
                  const away = teamMap[m.awayTeam];
                  return (
                    <Link
                      key={m.id}
                      href={`/matches/${m.id}`}
                      className="surface-1 p-4 flex items-center justify-between rounded hover:bg-[#0c2620] transition-colors group cursor-pointer"
                    >
                      <div className="flex-1 flex justify-end items-center gap-3 pr-6">
                        <span className="text-body-lg font-body-lg group-hover:text-primary-fixed-dim transition-colors uppercase">
                          {home?.name.replace("Team ", "")}
                        </span>
                        <span className="text-2xl">{home?.emoji}</span>
                      </div>
                      <div className="flex flex-col items-center justify-center w-28">
                        {m.result ? (
                          <>
                            <span className="text-scoreboard-num font-scoreboard-num text-primary-fixed-dim">
                              {m.result.scoreHome} - {m.result.scoreAway}
                            </span>
                            <span className="text-[10px] text-on-surface-variant font-label-caps mt-1">FT</span>
                          </>
                        ) : (
                          <span className="border border-primary-fixed-dim text-primary-fixed-dim text-label-caps font-label-caps px-2 py-1 rounded-sm">
                            TBD
                          </span>
                        )}
                      </div>
                      <div className="flex-1 flex justify-start items-center gap-3 pl-6">
                        <span className="text-2xl">{away?.emoji}</span>
                        <span className="text-body-lg font-body-lg group-hover:text-primary-fixed-dim transition-colors uppercase">
                          {away?.name.replace("Team ", "")}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </main>
      <Footer />
    </>
  );
}
