import Link from "next/link";
import { getLeague } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const league = await getLeague();
  const teamMap = Object.fromEntries(league.teams.map((t) => [t.id, t]));
  const pending = league.matches.filter((m) => !m.result);
  const recent = league.matches
    .filter((m) => m.result)
    .sort((a, b) => b.displayOrder - a.displayOrder)
    .slice(0, 5);

  return (
    <main className="flex-grow w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-8 flex flex-col gap-8">
      <div>
        <span className="text-label-caps font-label-caps text-primary-fixed-dim">
          ▸ CONTROL ROOM
        </span>
        <h1 className="text-display-md font-display-md text-primary-fixed-dim mt-1">
          DASHBOARD
        </h1>
        <p className="text-on-surface-variant text-body-sm max-w-xl mt-2">
          Quick links to every admin surface. All edits broadcast to public viewers in real time.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DashCard
          title="TEAMS & MEMBERS"
          desc="Rename teams, swap emoji/colors, manage rosters."
          href="/admin/teams"
          stat={`${league.teams.length} TEAMS`}
        />
        <DashCard
          title="SCHEDULE EDITOR"
          desc="Drag matches across days, auto-schedule, set match dates."
          href="/admin/schedule"
          stat={`${pending.length} PENDING`}
        />
        <DashCard
          title="RESULTS"
          desc="Enter scores and cards per match."
          href="/admin/schedule"
          stat={`${league.stats.played} / ${league.matches.length} PLAYED`}
        />
      </div>

      <section className="surface-1 rounded p-6 flex flex-col gap-4">
        <h2 className="text-headline-md font-headline-md text-primary uppercase">
          Recent activity
        </h2>
        {recent.length === 0 ? (
          <div className="text-on-surface-variant text-body-sm">No results entered yet.</div>
        ) : (
          <ul className="flex flex-col gap-2">
            {recent.map((m) => {
              const r = m.result!;
              const home = teamMap[m.homeTeam];
              const away = teamMap[m.awayTeam];
              return (
                <li
                  key={m.id}
                  className="flex items-center justify-between bg-[#071411] border border-[#1F4D3F] rounded p-3"
                >
                  <span className="text-body-sm font-body-sm text-on-surface-variant">
                    {m.matchDate}
                  </span>
                  <span className="font-scoreboard-num text-2xl text-primary-fixed-dim">
                    {home?.emoji} {r.scoreHome} - {r.scoreAway} {away?.emoji}
                  </span>
                  <Link
                    href={`/admin/matches/${m.id}`}
                    className="text-label-caps font-label-caps text-primary-fixed-dim hover:text-primary-fixed transition-colors"
                  >
                    EDIT →
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}

function DashCard({
  title,
  desc,
  href,
  stat,
}: {
  title: string;
  desc: string;
  href: string;
  stat: string;
}) {
  return (
    <Link
      href={href}
      className="surface-1 rounded p-6 flex flex-col gap-3 hover:border-primary-fixed-dim transition-colors group"
    >
      <span className="text-label-caps font-label-caps text-primary-fixed-dim">{stat}</span>
      <h3 className="text-headline-md font-headline-md text-primary uppercase group-hover:text-primary-fixed-dim transition-colors">
        {title}
      </h3>
      <p className="text-on-surface-variant text-body-sm">{desc}</p>
      <span className="text-primary-fixed-dim text-label-caps font-label-caps mt-auto">
        OPEN →
      </span>
    </Link>
  );
}
