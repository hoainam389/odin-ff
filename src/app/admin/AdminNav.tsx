"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ADMIN_NAV = [
  { href: "/admin", label: "DASHBOARD" },
  { href: "/admin/teams", label: "TEAMS" },
  { href: "/admin/schedule", label: "SCHEDULE" },
] as const;

export function AdminNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    // Match the section and any deeper route (e.g. /admin/matches/2 → SCHEDULE active).
    if (href === "/admin/schedule")
      return pathname === "/admin/schedule" || pathname.startsWith("/admin/matches");
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <nav className="flex gap-2 flex-wrap">
      {ADMIN_NAV.map((n) => {
        const active = isActive(n.href);
        return (
          <Link
            key={n.href}
            href={n.href}
            aria-current={active ? "page" : undefined}
            className={`px-4 py-2 surface-1 text-label-caps font-label-caps rounded uppercase transition-colors ${
              active
                ? "text-primary-fixed-dim"
                : "text-on-surface-variant hover:text-primary-fixed-dim"
            }`}
          >
            {n.label}
          </Link>
        );
      })}
    </nav>
  );
}
