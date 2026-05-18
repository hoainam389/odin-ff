import Link from "next/link";
import { notFound } from "next/navigation";
import { TopAppBar } from "@/components/TopAppBar";
import { Footer } from "@/components/Footer";
import { RealtimeRefresh } from "@/components/RealtimeRefresh";
import { getLeague } from "@/lib/queries";
import { getSession } from "@/lib/session";
import { formatHumanLong } from "@/lib/league";

export const dynamic = "force-dynamic";

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const matchId = Number(id);
  if (Number.isNaN(matchId)) notFound();

  const session = await getSession();
  const league = await getLeague();
  const teamMap = Object.fromEntries(league.teams.map((t) => [t.id, t]));
  const match = league.matches.find((m) => m.id === matchId);
  if (!match) notFound();

  const home = teamMap[match.homeTeam]!;
  const away = teamMap[match.awayTeam]!;
  const r = match.result;

  return (
    <>
      <RealtimeRefresh />
      <TopAppBar isAdmin={!!session.admin} />
      <main className="flex-grow w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-8 flex flex-col gap-8">
        <div className="flex items-center justify-between border-b border-[#1F4D3F] pb-4">
          <Link
            href="/fixtures"
            className="text-on-surface-variant font-label-caps hover:text-primary-fixed transition-colors uppercase tracking-widest text-sm"
          >
            ← Fixtures
          </Link>
          <span className="font-label-caps text-on-surface-variant uppercase">
            {formatHumanLong(match.matchDate)}
          </span>
          {session.admin && (
            <Link
              href={`/admin/matches/${match.id}`}
              className="px-3 py-1 bg-primary-fixed-dim text-[#050807] text-label-caps font-label-caps rounded font-bold"
            >
              EDIT RESULT
            </Link>
          )}
        </div>

        <section className="surface-1 rounded p-8 flex flex-col gap-6">
          <div className="grid grid-cols-3 items-center gap-4">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="text-6xl" style={{ filter: "drop-shadow(0 0 12px rgba(173,248,54,0.3))" }}>
                {home.emoji}
              </div>
              <div className="text-headline-md font-headline-md uppercase">{home.name}</div>
              <span
                className="w-12 h-1 rounded-full"
                style={{ background: home.color }}
              />
            </div>
            <div className="flex flex-col items-center gap-2">
              {r ? (
                <>
                  <div className="font-scoreboard-num text-[96px] leading-none text-primary-fixed-dim">
                    {r.scoreHome} : {r.scoreAway}
                  </div>
                  <div className="text-label-caps font-label-caps text-on-surface-variant">FULL TIME</div>
                </>
              ) : (
                <>
                  <div className="font-scoreboard-num text-[64px] leading-none text-primary-fixed-dim">
                    TBD
                  </div>
                  <div className="text-label-caps font-label-caps text-on-surface-variant">
                    NOT YET PLAYED
                  </div>
                </>
              )}
            </div>
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="text-6xl" style={{ filter: "drop-shadow(0 0 12px rgba(173,248,54,0.3))" }}>
                {away.emoji}
              </div>
              <div className="text-headline-md font-headline-md uppercase">{away.name}</div>
              <span
                className="w-12 h-1 rounded-full"
                style={{ background: away.color }}
              />
            </div>
          </div>

          {r && (
            <div className="grid grid-cols-3 gap-4 mt-4 border-t border-[#1F4D3F] pt-4">
              <CardCell yellow={r.yellowHome} red={r.redHome} />
              <div />
              <CardCell yellow={r.yellowAway} red={r.redAway} />
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}

function CardCell({ yellow, red }: { yellow: number; red: number }) {
  return (
    <div className="flex items-center justify-center gap-6">
      <div className="flex flex-col items-center">
        <span className="text-scoreboard-num text-3xl text-primary">{yellow}</span>
        <span className="text-label-caps font-label-caps text-on-surface-variant">🟨 YEL</span>
      </div>
      <div className="flex flex-col items-center">
        <span className={`text-scoreboard-num text-3xl ${red > 0 ? "text-error" : "text-primary"}`}>
          {red}
        </span>
        <span className="text-label-caps font-label-caps text-on-surface-variant">🟥 RED</span>
      </div>
    </div>
  );
}
