"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { PhoneSignIn } from "@/features/auth/components/PhoneSignIn";
import { firstName } from "@/lib/labels";

/** Só aceita destinos internos em ?next= (evita redirecionar para fora do site). */
function safeNext(next: string | null): string {
  return next && next.startsWith("/") && !next.startsWith("//")
    ? next
    : "/conta";
}

export function SignInPanel() {
  const router = useRouter();
  const params = useSearchParams();
  return (
    <PhoneSignIn
      onSignedIn={(client) => {
        toast.success(`Olá, ${firstName(client.name)}!`);
        router.push(safeNext(params.get("next")));
      }}
    />
  );
}
