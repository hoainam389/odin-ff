import { getAllTeams, getAllMembers } from "@/lib/queries";
import { updateTeamAction } from "../actions";
import { EmojiPicker } from "./EmojiPicker";
import { ColorPicker } from "./ColorPicker";

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
          TEAMS &amp; MEMBERS
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {teams.map((t) => {
          const teamMembers = membersByTeam.get(t.id) ?? [];
          const [m1, m2] = teamMembers;
          return (
            <section key={t.id} className="surface-1 rounded p-6">
              <form action={updateTeamAction} className="flex flex-col gap-4">
                <input type="hidden" name="id" value={t.id} />
                <div className="text-label-caps font-label-caps text-on-surface-variant">
                  TEAM {t.id}
                </div>
                <div className="flex items-center gap-3">
                  <EmojiPicker name="emoji" defaultValue={t.emoji} />
                  <ColorPicker name="color" defaultValue={t.color} />
                  <input
                    name="name"
                    defaultValue={t.name}
                    className="flex-1 bg-[#071411] border border-[#1F4D3F] focus:border-primary-fixed-dim rounded p-2 font-body-md outline-none h-12"
                  />
                </div>

                <div className="border-t border-[#1F4D3F] pt-3 flex flex-col gap-2">
                  <span className="text-label-caps font-label-caps text-on-surface-variant">
                    MEMBERS
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="hidden"
                      name="member1Id"
                      value={m1?.id ?? ""}
                    />
                    <input
                      name="member1Name"
                      defaultValue={m1?.name ?? ""}
                      placeholder="Member 1"
                      className="bg-[#071411] border border-[#1F4D3F] focus:border-primary-fixed-dim rounded p-2 font-body-sm outline-none"
                    />
                    <input
                      type="hidden"
                      name="member2Id"
                      value={m2?.id ?? ""}
                    />
                    <input
                      name="member2Name"
                      defaultValue={m2?.name ?? ""}
                      placeholder="Member 2"
                      className="bg-[#071411] border border-[#1F4D3F] focus:border-primary-fixed-dim rounded p-2 font-body-sm outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="self-end mt-2 px-4 py-2 bg-primary-fixed-dim text-[#050807] font-label-caps text-label-caps rounded font-bold uppercase hover:bg-primary-fixed transition-colors"
                >
                  Save team
                </button>
              </form>
            </section>
          );
        })}
      </div>
    </main>
  );
}
