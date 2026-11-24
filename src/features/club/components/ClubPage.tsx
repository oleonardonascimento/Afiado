"use client";

/** C5: Clube — como funciona (3 passos), planos lado a lado e perguntas frequentes. */
import { Check, Crown } from "lucide-react";
import Link from "next/link";
import { ErrorState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentClient } from "@/features/auth/hooks/useClientAuth";
import { usePlans, useServices } from "@/features/catalog/hooks/useCatalog";
import { useClientClub } from "@/features/club/hooks/useClientClub";
import { cn } from "@/lib/cn";
import { formatBRL } from "@/lib/format";
import { benefitLabel } from "@/lib/labels";

const STEPS = [
  { title: "Assine", text: "Escolha o plano e pague por Pix ou cartão. Sem taxa de adesão." },
  { title: "Agende", text: "Marque pelo site como sempre. O que o plano cobre aparece como R$ 0." },
  { title: "Corte sem pagar na hora", text: "No balcão o benefício já entra sozinho. Você só paga o que for extra." },
];

const FAQ = [
  {
    q: "Como cancelo?",
    a: "Em Minha conta › Meu plano, em 1 clique. Sem multa e sem ligação. O benefício vale até o fim do mês já pago.",
  },
  {
    q: "O que acontece se eu não usar no mês?",
    a: "O uso não acumula para o mês seguinte. Se perceber que está sobrando, troque para um plano menor.",
  },
  {
    q: "Posso usar em qualquer dia?",
    a: "Sim, em qualquer dia de funcionamento, respeitando o intervalo mínimo entre usos de cada plano.",
  },
  {
    q: "Como é a cobrança?",
    a: "A primeira cobrança é no dia da assinatura e as próximas no mesmo dia dos meses seguintes.",
  },
];

export function ClubPage() {
  const plans = usePlans();
  const services = useServices();
  const { client } = useCurrentClient();
  const club = useClientClub(client?.id ?? null);
  const list = (plans.data ?? []).filter((p) => p.active).sort((a, b) => a.priceCents - b.priceCents);
  const serviceName = (id: string) => services.data?.find((s) => s.id === id)?.name ?? "Serviço";
  const hasPlan = club.active;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-12 px-4 py-10">
      <header className="flex flex-col gap-3">
        <p className="inline-flex items-center gap-2 text-text-muted">
          <Crown className="size-5" strokeWidth={1.75} aria-hidden />
          Assinatura mensal
        </p>
        <h1 className="font-display text-5xl uppercase md:text-6xl">Clube Afiado</h1>
        <p className="max-w-prose text-lg">Um valor fixo por mês para manter o corte em dia, sem pensar no preço a cada visita.</p>
      </header>

      <section aria-labelledby="how" className="flex flex-col gap-4">
        <h2 id="how" className="text-2xl font-semibold">
          Como funciona
        </h2>
        <ol className="grid gap-4 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <li key={step.title} className="flex gap-3">
              <span className="font-display text-4xl text-text-muted tabular-nums" aria-hidden>
                {i + 1}
              </span>
              <span>
                <span className="block font-semibold">{step.title}</span>
                <span className="text-text-muted">{step.text}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="plans" className="flex flex-col gap-4">
        <h2 id="plans" className="text-2xl font-semibold">
          Planos
        </h2>
        {hasPlan && (
          <p className="rounded-control bg-surface-2 px-3 py-2">
            Você já é do Clube.{" "}
            <Link href="/conta/plano" className="underline underline-offset-4">
              Ver meu plano
            </Link>
          </p>
        )}
        {plans.isError ? (
          <ErrorState onRetry={() => void plans.refetch()} />
        ) : plans.isLoading || services.isLoading ? (
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <Skeleton key={n} className="h-80 rounded-card" />
            ))}
          </div>
        ) : (
          <ul className="grid gap-4 md:grid-cols-3">
            {list.map((plan) => (
              <li
                key={plan.id}
                className={cn(
                  "flex flex-col gap-4 rounded-card border bg-surface p-5",
                  plan.recommended ? "border-2 border-primary" : "border-border",
                )}
              >
                <div className="flex flex-col gap-1">
                  {plan.recommended && <span className="text-sm font-medium text-text-muted">Mais escolhido</span>}
                  <h3 className="text-xl font-semibold">{plan.name}</h3>
                  <p className="text-text-muted">{plan.description}</p>
                </div>
                <p>
                  <span className="text-3xl font-semibold tabular-nums">{formatBRL(plan.priceCents)}</span>
                  <span className="text-text-muted">/mês</span>
                </p>
                <ul className="flex flex-col gap-2">
                  {plan.benefits.map((b) => (
                    <li key={b.serviceId} className="flex items-start gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-success" strokeWidth={2} aria-hidden />
                      {benefitLabel(serviceName(b.serviceId), b.monthlyLimit)}
                    </li>
                  ))}
                  {plan.rules.minDaysBetweenUses > 0 && (
                    <li className="text-sm text-text-muted">
                      Intervalo de {plan.rules.minDaysBetweenUses} dias entre usos.
                    </li>
                  )}
                </ul>
                {!hasPlan && (
                  <Button
                    asChild
                    variant={plan.recommended ? "brand" : "secondary"}
                    size="lg"
                    className="mt-auto"
                  >
                    <Link href={`/clube/assinar/${plan.id}`}>Assinar o plano {plan.name}</Link>
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="faq" className="flex max-w-prose flex-col gap-4">
        <h2 id="faq" className="text-2xl font-semibold">
          Perguntas frequentes
        </h2>
        <div className="flex flex-col divide-y divide-border">
          {FAQ.map((item) => (
            <details key={item.q} className="group py-3">
              <summary className="cursor-pointer font-medium">{item.q}</summary>
              <p className="mt-2 text-text-muted">{item.a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
