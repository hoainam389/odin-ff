import { TopAppBar } from "@/components/TopAppBar";
import { Footer } from "@/components/Footer";
import { getLeague } from "@/lib/queries";
import { todayISO } from "@/lib/league";
import { FixturesView } from "./FixturesView";

export const revalidate = 30;

export default async function FixturesPage() {
  const league = await getLeague();
  const today = todayISO();

  return (
    <>
      <TopAppBar active="fixtures" />
      <FixturesView matches={league.matches} teams={league.teams} today={today} />
      <Footer />
    </>
  );
}
