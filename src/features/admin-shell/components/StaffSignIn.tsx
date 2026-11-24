"use client";

/** A1: entrada no painel da demonstração — escolhe um perfil da equipe (sem senha na V1). */
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Logo } from "@/components/shared/Logo";
import { PersonAvatar } from "@/components/shared/PersonAvatar";
import { ErrorState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useProfessionals } from "@/features/catalog/hooks/useCatalog";
import { useUpdateSession } from "@/hooks/useSession";
import { cn } from "@/lib/cn";
import { ROLE_LABEL } from "@/lib/labels";

export function StaffSignIn() {
  const router = useRouter();
  const professionals = useProfessionals();
  const updateSession = useUpdateSession();
  const [selected, setSelected] = useState<string | null>(null);
  const team = professionals.data?.filter((p) => p.active) ?? [];
  const chosen = team.find((p) => p.id === selected);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-4 py-10">
      <Logo />
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Entrar no painel</h1>
        <p className="text-text-muted">
          Demonstração: escolha com qual perfil da equipe quer entrar. Na versão final, a entrada é com e-mail e
          senha.
        </p>
      </div>
      {professionals.isLoading ? (
        <Skeleton className="h-64 rounded-card" />
      ) : professionals.isError ? (
        <ErrorState onRetry={() => void professionals.refetch()} />
      ) : (
        <div role="radiogroup" aria-label="Perfil" className="flex flex-col gap-2">
          {team.map((pro) => (
            <button
              key={pro.id}
              type="button"
              role="radio"
              aria-checked={selected === pro.id}
              onClick={() => setSelected(pro.id)}
              className={cn(
                "flex items-center gap-3 rounded-card border bg-surface p-3 text-left transition-colors duration-150",
                selected === pro.id ? "border-primary ring-1 ring-primary" : "border-border-strong hover:bg-surface-2",
              )}
            >
              <PersonAvatar name={pro.name} photoUrl={pro.photoUrl} size="sm" />
              <span className="flex flex-col">
                <span className="font-medium">{pro.name}</span>
                <span className="text-sm text-text-muted">{ROLE_LABEL[pro.role]}</span>
              </span>
            </button>
          ))}
        </div>
      )}
      <Button
        disabled={!chosen}
        loading={updateSession.isPending}
        onClick={() => {
          if (!chosen) return;
          updateSession.mutate(
            { staffId: chosen.id, role: chosen.role },
            {
              onSuccess: () => {
                toast.success(`Bem-vindo, ${chosen.name.split(" ")[0]}`);
                router.push(chosen.role === "barber" ? "/admin/agenda" : "/admin");
              },
              onError: () => toast.error("Não foi possível entrar. Tente de novo."),
            },
          );
        }}
      >
        Entrar no painel
      </Button>
    </main>
  );
}
