import { TopAppBar } from "@/components/TopAppBar";
import { Footer } from "@/components/Footer";
import { getSession } from "@/lib/session";
import { logoutAction } from "../login/actions";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  return (
    <>
      <TopAppBar active="admin" />
      {session.admin ? (
        <div className="w-full bg-[#071411] border-b border-[#1F4D3F]">
          <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-3 flex justify-end items-center gap-4 flex-wrap">
            <form action={logoutAction}>
              <button
                type="submit"
                className="px-4 py-2 text-label-caps font-label-caps text-accent-pink rounded hover:bg-error-container/30 transition-colors uppercase"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      ) : null}
      {children}
      <Footer />
    </>
  );
}
