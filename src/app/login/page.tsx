import { redirect } from "next/navigation";
import { TopAppBar } from "@/components/TopAppBar";
import { Footer } from "@/components/Footer";
import { getSession } from "@/lib/session";
import { LoginForm } from "./LoginForm";

type SearchParams = Promise<{ from?: string }>;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { from } = await searchParams;
  const session = await getSession();
  if (session.admin) redirect(from || "/admin");

  return (
    <>
      <TopAppBar />
      <main className="flex-grow w-full max-w-md mx-auto px-margin-mobile md:px-margin-desktop py-16 flex flex-col gap-8">
        <div className="surface-1 rounded p-8 flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <span className="text-label-caps font-label-caps text-primary-fixed-dim">
              ▸ TERMINAL ACCESS
            </span>
            <h1 className="text-display-md font-display-md text-primary-fixed-dim leading-none">
              CONTROL ROOM
            </h1>
            <p className="text-on-surface-variant text-body-sm mt-2">
              Single-admin login. Credentials are set via environment variables.
            </p>
          </div>
          <LoginForm from={from ?? "/admin"} />
        </div>
      </main>
      <Footer />
    </>
  );
}
