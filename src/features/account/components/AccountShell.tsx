"use client";

/** Área do cliente: exige login (manda para /entrar) e mostra a navegação da conta. */
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect } from "react";
import { ErrorState } from "@/components/shared/states";
import { Skeleton } from "@/components/ui/skeleton";
import type { Client } from "@/domain/entities";
import { useCurrentClient } from "@/features/auth/hooks/useClientAuth";
import { cn } from "@/lib/cn";

const TABS = [
  { href: "/conta", label: "Início" },
  { href: "/conta/agendamentos", label: "Agendamentos" },
  { href: "/conta/plano", label: "Meu plano" },
  { href: "/conta/perfil", label: "Perfil" },
];

const AccountClientContext = createContext<Client | null>(null);

/** Cliente logado dentro da área /conta (o AccountShell só renderiza os filhos com cliente). */
export function useAccountClient(): Client {
  const client = useContext(AccountClientContext);
  if (!client) throw new Error("useAccountClient fora do AccountShell");
  return client;
}

type AccountShellProps = { children: React.ReactNode };

export function AccountShell({ children }: AccountShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { client, isLoading, isError } = useCurrentClient();

  useEffect(() => {
    if (!isLoading && !isError && !client)
      router.replace(`/entrar?next=${encodeURIComponent(pathname)}`);
  }, [client, isLoading, isError, pathname, router]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8">
      <nav aria-label="Minha conta" className="-mx-4 overflow-x-auto px-4">
        <ul className="border-border flex gap-1 border-b">
          {TABS.map((tab) => {
            const active = pathname === tab.href;
            return (
              <li key={tab.href}>
                <Link
                  href={tab.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "-mb-px flex min-h-11 items-center border-b-2 px-3 text-sm whitespace-nowrap",
                    active
                      ? "border-primary text-text font-medium"
                      : "text-text-muted hover:text-text border-transparent",
                  )}
                >
                  {tab.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      {isError ? (
        <ErrorState />
      ) : client ? (
        <AccountClientContext.Provider value={client}>
          {children}
        </AccountClientContext.Provider>
      ) : (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="rounded-card h-32" />
        </div>
      )}
    </div>
  );
}
