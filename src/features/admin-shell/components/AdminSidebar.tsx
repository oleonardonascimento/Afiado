"use client";

import { Logo } from "@/components/shared/Logo";
import { AdminNavLink } from "@/features/admin-shell/components/AdminNavLink";
import { navForRole } from "@/features/admin-shell/nav";
import { useStaffRole } from "@/hooks/useSession";

export function AdminSidebar() {
  const items = navForRole(useStaffRole());
  const primary = items.filter((i) => i.mobile);
  const rest = items.filter((i) => !i.mobile);
  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-6 border-r border-border bg-surface p-4 lg:flex">
      <Logo size="sm" className="px-3 pt-2" />
      <nav aria-label="Painel" className="flex flex-col gap-1">
        {primary.map((item) => (
          <AdminNavLink key={item.href} item={item} layout="row" />
        ))}
        <div className="my-2 border-t border-border" />
        {rest.map((item) => (
          <AdminNavLink key={item.href} item={item} layout="row" />
        ))}
      </nav>
    </aside>
  );
}
