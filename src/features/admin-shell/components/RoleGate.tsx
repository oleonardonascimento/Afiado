"use client";

/** Mostra a tela só se o papel atual tem acesso à rota (mesma regra do menu). */
import { Lock } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { EmptyState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { canAccess } from "@/features/admin-shell/nav";
import { useStaffRole } from "@/hooks/useSession";
import { ROLE_LABEL } from "@/lib/labels";

export function RoleGate({ children }: { children: React.ReactNode }) {
  const role = useStaffRole();
  const pathname = usePathname();
  if (canAccess(role, pathname)) return children;
  return (
    <EmptyState
      icon={Lock}
      title="Esta tela não está disponível para o seu papel"
      description={`Você está como ${ROLE_LABEL[role]}. Troque o papel no topo da tela ou volte para o início.`}
    >
      <Button asChild variant="secondary">
        <Link href="/admin">Ir para o início</Link>
      </Button>
    </EmptyState>
  );
}
