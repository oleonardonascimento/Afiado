"use client";

/**
 * C6: checkout do plano — resumo, identificação, forma de pagamento simulada, datas das cobranças,
 * aceite dos termos e "Assinar". Na V1 não há dados de cartão: o pagamento é simulado.
 */
import { CheckCircle2, Crown } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { OperationError } from "@/data/repositories";
import { useCurrentClient } from "@/features/auth/hooks/useClientAuth";
import { usePlans, useServices } from "@/features/catalog/hooks/useCatalog";
import { useSubscribe } from "@/features/club/hooks/useClubAdmin";
import { addMonths, middayIso, todayIn } from "@/lib/calendar";
import { cn } from "@/lib/cn";
import { formatBRL, formatDate } from "@/lib/format";
import { benefitLabel } from "@/lib/labels";

const METHODS = [
  { id: "pix", label: "Pix", hint: "Aprovação na hora." },
  {
    id: "card",
    label: "Cartão de crédito",
    hint: "Cobrança automática todo mês.",
  },
] as const;

export function ClubCheckout({ planId }: { planId: string }) {
  const plans = usePlans();
  const services = useServices();
  const { client, isLoading: clientLoading } = useCurrentClient();
  const subscribe = useSubscribe();
  const [method, setMethod] = useState<"pix" | "card">("pix");
  const [accepted, setAccepted] = useState(false);
  const [done, setDone] = useState(false);

  const plan = plans.data?.find((p) => p.id === planId && p.active);
  const today = todayIn(new Date());

  if (plans.isLoading || clientLoading)
    return <Skeleton className="rounded-card mx-auto my-10 h-96 max-w-xl" />;
  if (plans.isError)
    return (
      <ErrorState
        className="mx-auto my-10 max-w-xl"
        onRetry={() => void plans.refetch()}
      />
    );
  if (!plan) {
    return (
      <div className="mx-auto max-w-xl px-4 py-10">
        <EmptyState
          title="Plano não encontrado"
          description="Este plano não está mais disponível."
        >
          <Button asChild variant="secondary">
            <Link href="/clube">Ver planos</Link>
          </Button>
        </EmptyState>
      </div>
    );
  }

  if (done) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-start gap-4 px-4 py-10">
        <CheckCircle2
          className="text-success size-10"
          strokeWidth={1.75}
          aria-hidden
        />
        <h1 className="text-2xl font-semibold">Bem-vindo ao Clube</h1>
        <p className="text-text-muted">
          Seu plano {plan.name} já vale a partir de hoje. Ao agendar, os
          serviços do plano aparecem como R$ 0.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="brand">
            <Link href="/agendar">Agendar horário</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/conta/plano">Ver meu plano</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 px-4 py-10">
      <Link
        href="/clube"
        className="text-text-muted hover:text-text self-start text-sm"
      >
        Voltar aos planos
      </Link>
      <h1 className="text-2xl font-semibold">Assinar o plano {plan.name}</h1>

      <section
        aria-label="Resumo"
        className="rounded-card border-border bg-surface flex flex-col gap-3 border p-4"
      >
        <p className="flex items-center justify-between">
          <span className="inline-flex items-center gap-2 font-medium">
            <Crown className="size-4" strokeWidth={1.75} aria-hidden />{" "}
            {plan.name}
          </span>
          <span className="tabular-nums">{formatBRL(plan.priceCents)}/mês</span>
        </p>
        <ul className="text-text-muted text-sm">
          {plan.benefits.map((b) => (
            <li key={b.serviceId}>
              {benefitLabel(
                services.data?.find((s) => s.id === b.serviceId)?.name ??
                  "Serviço",
                b.monthlyLimit,
              )}
            </li>
          ))}
        </ul>
        <dl className="border-border grid grid-cols-2 gap-1 border-t pt-3 text-sm">
          <dt className="text-text-muted">Primeira cobrança</dt>
          <dd className="text-right tabular-nums">
            hoje, {formatDate(middayIso(today), "dd/MM")}
          </dd>
          <dt className="text-text-muted">Próxima cobrança</dt>
          <dd className="text-right tabular-nums">
            {formatDate(middayIso(addMonths(today, 1)), "dd/MM/yyyy")}
          </dd>
        </dl>
      </section>

      {!client ? (
        <section className="rounded-card border-border bg-surface flex flex-col items-start gap-3 border p-4">
          <p>Para assinar, entre com seu celular. Leva menos de um minuto.</p>
          <Button asChild>
            <Link
              href={`/entrar?next=${encodeURIComponent(`/clube/assinar/${plan.id}`)}`}
            >
              Entrar com celular
            </Link>
          </Button>
        </section>
      ) : (
        <>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 font-medium">Forma de pagamento</legend>
            <div
              role="radiogroup"
              aria-label="Forma de pagamento"
              className="flex flex-col gap-2"
            >
              {METHODS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  role="radio"
                  aria-checked={method === m.id}
                  onClick={() => setMethod(m.id)}
                  className={cn(
                    "rounded-card bg-surface flex flex-col border p-3 text-left",
                    method === m.id
                      ? "border-primary ring-primary ring-1"
                      : "border-border-strong hover:bg-surface-2",
                  )}
                >
                  <span className="font-medium">{m.label}</span>
                  <span className="text-text-muted text-sm">{m.hint}</span>
                </button>
              ))}
            </div>
            <p className="text-text-muted text-sm">
              Demonstração: o pagamento é simulado e aprovado na hora.
            </p>
          </fieldset>

          <label className="flex items-start gap-3 text-sm">
            <Checkbox
              checked={accepted}
              onCheckedChange={(v) => setAccepted(v === true)}
              className="mt-0.5"
            />
            <span>
              Li e aceito os{" "}
              <Link
                href="/termos"
                className="underline underline-offset-4"
                target="_blank"
              >
                termos do Clube
              </Link>
              . Posso cancelar quando quiser; o benefício vale até o fim do mês
              pago.
            </span>
          </label>

          <Button
            variant="brand"
            size="lg"
            disabled={!accepted}
            loading={subscribe.isPending}
            onClick={() =>
              subscribe.mutate(
                { clientId: client.id, planId: plan.id, paymentMethod: method },
                {
                  onSuccess: () => {
                    toast.success("Assinatura confirmada");
                    setDone(true);
                  },
                  onError: (e) =>
                    toast.error(
                      e instanceof OperationError
                        ? e.message
                        : "Não foi possível assinar. Tente de novo.",
                    ),
                },
              )
            }
          >
            Assinar por {formatBRL(plan.priceCents)}/mês
          </Button>
        </>
      )}
    </div>
  );
}
