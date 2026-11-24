import { Logo } from "@/components/shared/Logo";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { RoleSwitcher } from "@/features/admin-shell/components/RoleSwitcher";

export function AdminTopBar() {
  return (
    <header className="border-border bg-surface sticky top-0 z-30 flex h-14 items-center gap-2 border-b px-4">
      <Logo size="sm" className="lg:hidden" />
      <div className="ml-auto flex items-center gap-1">
        <RoleSwitcher />
        <ThemeToggle />
      </div>
    </header>
  );
}
