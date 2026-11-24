"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isActive, type AdminNavItem } from "@/features/admin-shell/nav";
import { cn } from "@/lib/cn";

type AdminNavLinkProps = {
  item: AdminNavItem;
  layout: "row" | "stack";
  onNavigate?: () => void;
};

export function AdminNavLink({ item, layout, onNavigate }: AdminNavLinkProps) {
  const pathname = usePathname();
  const active = isActive(pathname, item.href);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "rounded-control flex min-h-11 items-center transition-colors duration-150",
        layout === "row"
          ? "gap-3 px-3 text-sm"
          : "flex-1 flex-col justify-center gap-0.5 text-xs",
        active
          ? "bg-primary text-primary-fg"
          : "text-text-muted hover:bg-surface-2 hover:text-text",
      )}
    >
      <Icon className="size-5 shrink-0" strokeWidth={1.75} aria-hidden />
      {item.label}
    </Link>
  );
}
