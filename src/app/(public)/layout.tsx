import Link from "next/link";
import { Logo } from "@/components/shared/Logo";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { AccountLink } from "@/features/auth/components/AccountLink";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="border-border bg-surface border-b">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-2 px-4">
          <Link
            href="/"
            aria-label="Afiado, página inicial"
            className="rounded-control"
          >
            <Logo size="sm" />
          </Link>
          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <AccountLink />
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-border bg-surface border-t pb-24 md:pb-0">
        <div className="text-text-muted mx-auto flex max-w-5xl flex-wrap gap-x-6 gap-y-2 px-4 py-6 text-sm">
          <span>© Afiado</span>
          <Link href="/termos" className="hover:text-text">
            Termos de uso
          </Link>
          <Link href="/privacidade" className="hover:text-text">
            Privacidade
          </Link>
        </div>
      </footer>
    </>
  );
}
