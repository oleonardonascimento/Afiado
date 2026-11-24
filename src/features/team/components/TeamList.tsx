"use client";

/** A12: equipe — um cartão por pessoa com papel, comissão e serviços; leva à ficha de edição. */
import { Plus, UserSquare2 } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { PersonAvatar } from "@/components/shared/PersonAvatar";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useProfessionals } from "@/features/catalog/hooks/useCatalog";
import { cn } from "@/lib/cn";
import { ROLE_LABEL } from "@/lib/labels";

export function TeamList() {
  const professionals = useProfessionals();

  if (professionals.isError)
    return <ErrorState onRetry={() => void professionals.refetch()} />;
  const list = professionals.data ?? [];

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <PageHeader title="Equipe">
        <Button asChild>
          <Link href="/admin/equipe/novo">
            <Plus strokeWidth={1.75} aria-hidden />
            Adicionar pessoa
          </Link>
        </Button>
      </PageHeader>
      {professionals.isLoading ? (
        <Skeleton className="rounded-card h-64" />
      ) : list.length === 0 ? (
        <EmptyState
          icon={UserSquare2}
          title="Ninguém na equipe ainda"
          description="Adicione os barbeiros para abrir a agenda."
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {list.map((p) => (
            <li key={p.id}>
              <Link
                href={`/admin/equipe/${p.id}`}
                className={cn(
                  "rounded-card border-border bg-surface hover:bg-surface-2 focus-visible:outline-ring flex items-center gap-3 border p-4 focus-visible:outline-2",
                  !p.active && "opacity-70",
                )}
              >
                <PersonAvatar name={p.name} photoUrl={p.photoUrl} />
                <span className="min-w-0">
                  <span className="block truncate font-medium">{p.name}</span>
                  <span className="text-text-muted block text-sm">
                    {ROLE_LABEL[p.role]}
                    {p.role !== "reception" && (
                      <>
                        {" "}
                        · comissão {p.commissionPct}% · {p.serviceIds.length}{" "}
                        serviços
                      </>
                    )}
                    {!p.active && " · inativo"}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
