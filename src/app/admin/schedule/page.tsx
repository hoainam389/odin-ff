import Link from "next/link";
import { getLeague } from "@/lib/queries";
import { ScheduleBoard } from "./ScheduleBoard";
import { AutoScheduleButton } from "./AutoScheduleButton";
import { formatBannerDate, todayISO } from "@/lib/league";

export const dynamic = "force-dynamic";

export default async function AdminSchedulePage() {
  const league = await getLeague();
  const today = todayISO();

  return (
    <main className="flex-grow w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-8 flex flex-col gap-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <span className="text-label-caps font-label-caps text-primary-fixed-dim">
            ▸ ADMIN
          </span>
          <h1 className="text-display-md font-display-md text-primary-fixed-dim mt-1">
            SCHEDULE EDITOR
          </h1>
          <p className="text-on-surface-variant text-body-sm mt-2 max-w-xl">
            Drag a match onto a different day to reschedule. Use auto-schedule
            to redistribute pending matches 3 per workday (weekends skipped).
          </p>
        </div>
        <AutoScheduleButton />
      </div>

      <ScheduleBoard
        matches={league.matches}
        teams={league.teams}
        today={today}
        formatBanner={Object.fromEntries(
          Array.from(new Set(league.matches.map((m) => m.matchDate))).map((d) => [
            d,
            formatBannerDate(d),
          ]),
        )}
      />

      <div className="surface-1 rounded p-6 flex flex-col gap-2">
        <h2 className="text-headline-md font-headline-md text-primary uppercase">Tips</h2>
        <ul className="text-on-surface-variant text-body-sm list-disc list-inside">
          <li>Drag a row onto a date banner to move it to that day.</li>
          <li>Drop on another row in the same day to reorder.</li>
          <li>
            Auto-schedule re-distributes <strong>pending</strong> matches only — completed games keep
            their date.
          </li>
          <li>
            Use{" "}
            <Link href="/admin/teams" className="text-primary-fixed-dim">
              Teams
            </Link>{" "}
            to rename or recolor teams.
          </li>
        </ul>
      </div>
    </main>
  );
}
