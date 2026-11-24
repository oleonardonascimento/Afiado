import type { Metadata } from "next";
import { Suspense } from "react";
import { SignInPanel } from "@/features/auth/components/SignInPanel";

export const metadata: Metadata = { title: "Entrar" };

export default function SignInPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Entrar</h1>
        <p className="text-text-muted">Use seu celular. Se for a primeira vez, o cadastro leva 20 segundos.</p>
      </div>
      <Suspense>
        <SignInPanel />
      </Suspense>
    </div>
  );
}
