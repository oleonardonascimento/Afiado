import Link from "next/link";
import { PoleStripe } from "@/components/shared/PoleStripe";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <>
      <PoleStripe className="h-1.5" />
      <section className="mx-auto max-w-5xl px-4 py-12">
        <h1 className="font-display text-5xl leading-display font-black tracking-display text-primary uppercase md:text-6xl dark:text-text">
          Afiado
        </h1>
        <p className="mt-4 max-w-prose text-lg text-text-muted">
          Barbearia na Asa Norte. Agende em menos de um minuto, sem criar conta.
        </p>
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface p-3 md:static md:mt-8 md:border-0 md:bg-transparent md:p-0">
          <Button asChild variant="brand" size="lg" className="w-full md:w-auto">
            <Link href="/agendar">Agendar horário</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
