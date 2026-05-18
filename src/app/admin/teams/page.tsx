import { getAllTeams, getAllMembers } from "@/lib/queries";
import {
  updateTeamAction,
  addMemberAction,
  removeMemberAction,
} from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminTeamsPage() {
  const [teams, members] = await Promise.all([getAllTeams(), getAllMembers()]);
  const membersByTeam = new Map<string, typeof members>();
  members.forEach((m) => {
    const arr = membersByTeam.get(m.teamId) ?? [];
    arr.push(m);
    membersByTeam.set(m.teamId, arr);
  });

  return (
    <main className="flex-grow w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-8 flex flex-col gap-8">
      <div>
        <span className="text-label-caps font-label-caps text-primary-fixed-dim">
          ▸ ADMIN
        </span>
        <h1 className="text-display-md font-display-md text-primary-fixed-dim mt-1">
          TEAMS & MEMBERS
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {teams.map((t) => {
          const teamMembers = membersByTeam.get(t.id) ?? [];
          return (
            <section key={t.id} className="surface-1 rounded p-6 flex flex-col gap-4">
              <form action={updateTeamAction} className="flex flex-col gap-3">
                <input type="hidden" name="id" value={t.id} />
                <div className="flex items-center gap-3">
                  <span
                    className="w-12 h-12 flex items-center justify-center text-3xl border border-[#1F4D3F] rounded"
                    style={{ background: "#071411", boxShadow: `inset 0 0 0 2px ${t.color}40` }}
                  >
                    {t.emoji}
                  </span>
                  <div className="flex-1">
                    <span className="text-label-caps font-label-caps text-on-surface-variant">
                      TEAM {t.id}
                    </span>
                    <input
                      name="name"
                      defaultValue={t.name}
                      className="w-full bg-[#071411] border border-[#1F4D3F] focus:border-primary-fixed-dim rounded p-2 font-body-md outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1">
                    <span className="text-label-caps font-label-caps text-on-surface-variant">
                      EMOJI
                    </span>
                    <input
                      name="emoji"
                      defaultValue={t.emoji}
                      maxLength={4}
                      className="bg-[#071411] border border-[#1F4D3F] focus:border-primary-fixed-dim rounded p-2 font-body-md outline-none"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-label-caps font-label-caps text-on-surface-variant">
                      COLOR
                    </span>
                    <input
                      name="color"
                      type="color"
                      defaultValue={t.color}
                      className="bg-[#071411] border border-[#1F4D3F] rounded p-1 h-10 outline-none"
                    />
                  </label>
                </div>
                <button
                  type="submit"
                  className="self-start px-4 py-2 bg-primary-fixed-dim text-[#050807] font-label-caps text-label-caps rounded font-bold uppercase hover:bg-primary-fixed transition-colors"
                >
                  Save team
                </button>
              </form>

              <div className="border-t border-[#1F4D3F] pt-3 flex flex-col gap-2">
                <span className="text-label-caps font-label-caps text-on-surface-variant">
                  MEMBERS ({teamMembers.length})
                </span>
                <ul className="flex flex-col gap-1">
                  {teamMembers.map((m) => (
                    <li
                      key={m.id}
                      className="flex justify-between items-center bg-[#071411] border border-[#1F4D3F] rounded px-3 py-2 text-body-sm"
                    >
                      <span>{m.name}</span>
                      <form action={removeMemberAction}>
                        <input type="hidden" name="id" value={m.id} />
                        <button
                          type="submit"
                          className="text-accent-pink hover:text-error transition-colors text-label-caps font-label-caps"
                        >
                          REMOVE
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>
                <form action={addMemberAction} className="flex gap-2 mt-1">
                  <input type="hidden" name="teamId" value={t.id} />
                  <input
                    name="name"
                    placeholder="New member name"
                    required
                    className="flex-1 bg-[#071411] border border-[#1F4D3F] focus:border-primary-fixed-dim rounded p-2 font-body-sm outline-none"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 surface-1 text-primary-fixed-dim font-label-caps text-label-caps rounded hover:bg-[#0c2620] transition-colors"
                  >
                    + ADD
                  </button>
                </form>
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
