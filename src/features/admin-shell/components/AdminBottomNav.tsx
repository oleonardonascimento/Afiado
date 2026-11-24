"use client";

import { Menu } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { AdminNavLink } from "@/features/admin-shell/components/AdminNavLink";
import { navForRole } from "@/features/admin-shell/nav";
import { useStaffRole } from "@/hooks/useSession";

/** Barra inferior do painel no celular: 4 atalhos + "Mais". */
export function AdminBottomNav() {
  const [open, setOpen] = useState(false);
  const items = navForRole(useStaffRole());
  const primary = items.filter((i) => i.mobile);
  const rest = items.filter((i) => !i.mobile);
  return (
    <nav
      aria-label="Painel"
      className="fixed inset-x-0 bottom-0 z-40 flex gap-1 border-t border-border bg-surface px-2 pt-1 pb-[max(0.25rem,env(safe-area-inset-bottom))] lg:hidden"
    >
      {primary.map((item) => (
        <AdminNavLink key={item.href} item={item} layout="stack" />
      ))}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            className="h-auto min-h-11 flex-1 flex-col gap-0.5 px-0 text-xs text-text-muted"
          >
            <Menu className="size-5" strokeWidth={1.75} aria-hidden />
            Mais
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="rounded-t-card">
          <SheetHeader>
            <SheetTitle>Mais opções</SheetTitle>
          </SheetHeader>
          <div className="grid gap-1 px-4 pb-6">
            {rest.map((item) => (
              <AdminNavLink
                key={item.href}
                item={item}
                layout="row"
                onNavigate={() => setOpen(false)}
              />
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
}
