import Link from "next/link";

type Nav = { href: string; label: string };

const NAV: Nav[] = [
  { href: "/", label: "STANDINGS" },
  { href: "/fixtures", label: "FIXTURES" },
];

type Props = {
  active?: "standings" | "fixtures" | "admin";
};

export function TopAppBar({ active }: Props) {
  return (
    <header className="bg-surface border-b-2 border-primary-fixed-dim shadow-[0_4px_12px_rgba(146,219,11,0.3)] sticky top-0 z-40">
      <div className="flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop py-4 max-w-container-max mx-auto">
        <Link href="/" className="flex items-center gap-4">
          <div className="w-10 h-10 border-2 border-primary-fixed flex items-center justify-center bg-[#071411]">
            <span className="text-primary-fixed text-xl">⚽</span>
          </div>
          <div>
            <h1 className="text-headline-lg font-headline-lg text-primary-fixed-dim italic uppercase tracking-wider leading-none">
              ODIN
            </h1>
            <div className="text-label-caps font-label-caps text-on-surface-variant opacity-80 mt-1">
              EST. 2026 · NITECO INTERNAL LEAGUE
            </div>
          </div>
        </Link>
        <nav className="hidden md:flex gap-8 items-center h-full">
          {NAV.map((n) => {
            const isActive =
              (n.href === "/" && active === "standings") ||
              (n.href === "/fixtures" && active === "fixtures");
            return (
              <Link
                key={n.href}
                href={n.href}
                className={
                  isActive
                    ? "text-primary-fixed border-b-2 border-primary-fixed pb-2 text-headline-md font-headline-md mt-2"
                    : "text-on-surface-variant font-label-caps hover:text-primary-fixed-dim transition-colors uppercase tracking-widest text-sm"
                }
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-6">
          <div className="hidden sm:flex items-center gap-2 bg-accent-pink text-surface px-3 py-1 rounded live-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-surface" />
            <span className="font-label-caps text-label-caps">LIVE</span>
          </div>
          <Link
            href="/admin"
            className={
              active === "admin"
                ? "text-primary-fixed font-label-caps uppercase tracking-widest text-sm"
                : "text-on-surface-variant font-label-caps hover:text-primary-fixed transition-colors uppercase tracking-widest text-sm"
            }
          >
            ADMIN
          </Link>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 w-full h-[2px] led-strip" />
    </header>
  );
}
