import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getLeague } from "@/lib/queries";
import { formatHumanLong } from "@/lib/league";
import { upsertResultAction, deleteResultAction } from "../../actions";

export const dynamic = "force-dynamic";

export default async function AdminMatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const matchId = Number(id);
  if (Number.isNaN(matchId)) notFound();

  const league = await getLeague();
  const teamMap = Object.fromEntries(league.teams.map((t) => [t.id, t]));
  const match = league.matches.find((m) => m.id === matchId);
  if (!match) notFound();

  const home = teamMap[match.homeTeam]!;
  const away = teamMap[match.awayTeam]!;
  const r = match.result;

  async function saveAndRedirect(formData: FormData) {
    "use server";
    await upsertResultAction(formData);
    redirect(`/admin/schedule#match-${matchId}`);
  }

  async function clearAndRedirect(formData: FormData) {
    "use server";
    await deleteResultAction(formData);
    redirect(`/admin/schedule#match-${matchId}`);
  }

  const clearFormId = `clear-${matchId}`;

  return (
    <main className="flex-grow w-full max-w-3xl mx-auto px-margin-mobile md:px-margin-desktop py-8 flex flex-col gap-6">
      {/* Clear form lives outside the save form (no nested forms allowed in HTML). */}
      {r && (
        <form id={clearFormId} action={clearAndRedirect} className="hidden">
          <input type="hidden" name="matchId" value={match.id} />
        </form>
      )}
      <div className="flex items-center justify-between border-b border-[#1F4D3F] pb-4">
        <Link
          href="/admin/schedule"
          className="text-on-surface-variant font-label-caps uppercase tracking-widest text-sm hover:text-primary-fixed-dim transition-colors"
        >
          ← Schedule
        </Link>
        <span className="font-label-caps text-on-surface-variant uppercase">
          {formatHumanLong(match.matchDate)}
        </span>
      </div>

      <form action={saveAndRedirect} className="surface-1 rounded p-8 flex flex-col gap-6">
        <input type="hidden" name="matchId" value={match.id} />

        <div className="grid grid-cols-3 items-center gap-4">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="text-5xl">{home.emoji}</div>
            <div className="text-headline-md font-headline-md uppercase">{home.name}</div>
            <input
              name="scoreHome"
              type="number"
              min={0}
              defaultValue={r?.scoreHome ?? 0}
              required
              className="w-24 bg-[#071411] border border-[#1F4D3F] focus:border-primary-fixed-dim rounded p-2 text-center font-scoreboard-num text-4xl text-primary-fixed-dim outline-none"
            />
          </div>
          <div className="text-center font-scoreboard-num text-4xl text-on-surface-variant">VS</div>
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="text-5xl">{away.emoji}</div>
            <div className="text-headline-md font-headline-md uppercase">{away.name}</div>
            <input
              name="scoreAway"
              type="number"
              min={0}
              defaultValue={r?.scoreAway ?? 0}
              required
              className="w-24 bg-[#071411] border border-[#1F4D3F] focus:border-primary-fixed-dim rounded p-2 text-center font-scoreboard-num text-4xl text-primary-fixed-dim outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 pt-4 border-t border-[#1F4D3F]">
          <fieldset className="flex flex-col gap-3">
            <legend className="text-label-caps font-label-caps text-on-surface-variant px-1">
              {home.name.toUpperCase()} CARDS
            </legend>
            <NumberInput name="yellowHome" label="🟨 YELLOW" defaultValue={r?.yellowHome ?? 0} />
            <NumberInput name="redHome" label="🟥 RED" defaultValue={r?.redHome ?? 0} />
          </fieldset>
          <fieldset className="flex flex-col gap-3">
            <legend className="text-label-caps font-label-caps text-on-surface-variant px-1">
              {away.name.toUpperCase()} CARDS
            </legend>
            <NumberInput name="yellowAway" label="🟨 YELLOW" defaultValue={r?.yellowAway ?? 0} />
            <NumberInput name="redAway" label="🟥 RED" defaultValue={r?.redAway ?? 0} />
          </fieldset>
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-[#1F4D3F]">
          {r ? (
            <button
              type="submit"
              form={clearFormId}
              className="px-4 py-2 text-label-caps font-label-caps text-accent-pink hover:bg-error-container/30 rounded uppercase transition-colors"
            >
              Clear result
            </button>
          ) : (
            <span />
          )}
          <button
            type="submit"
            className="px-6 py-3 bg-primary-fixed-dim text-[#050807] font-label-caps text-label-caps rounded font-bold uppercase hover:bg-primary-fixed transition-colors"
          >
            Save result
          </button>
        </div>
      </form>
    </main>
  );
}

function NumberInput({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue: number;
}) {
  return (
    <label className="flex items-center justify-between gap-3">
      <span className="text-body-md">{label}</span>
      <input
        name={name}
        type="number"
        min={0}
        defaultValue={defaultValue}
        className="w-20 bg-[#071411] border border-[#1F4D3F] focus:border-primary-fixed-dim rounded p-2 text-center font-scoreboard-num text-xl text-primary outline-none"
      />
    </label>
  );
}

