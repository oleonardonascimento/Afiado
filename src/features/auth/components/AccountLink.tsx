"use client";

import Link from "next/link";
import { PersonAvatar } from "@/components/shared/PersonAvatar";
import { Button } from "@/components/ui/button";
import { useCurrentClient } from "@/features/auth/hooks/useClientAuth";
import { firstName } from "@/lib/labels";

/** Cabeçalho público: "Entrar" para visitante, avatar + nome para cliente logado. */
export function AccountLink() {
  const { client } = useCurrentClient();
  if (!client) {
    return (
      <Button asChild variant="ghost" size="sm">
        <Link href="/entrar">Entrar</Link>
      </Button>
    );
  }
  return (
    <Button asChild variant="ghost" size="sm" className="gap-2 pl-1">
      <Link href="/conta" aria-label={`Minha conta (${client.name})`}>
        <PersonAvatar name={client.name} size="sm" className="size-7 text-xs" />
        {firstName(client.name)}
      </Link>
    </Button>
  );
}
