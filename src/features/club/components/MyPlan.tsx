"use client";

/** C10: meu plano — status, uso do mês, próxima cobrança, histórico de cobranças e cancelar em 1 clique. */
import { Crown } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { EmptyState, ErrorState } from "@/components/shared/states";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { remainingLabel } from "@/domain/subscription";
import { useAccountClient } from "@/features/account/components/AccountShell";
import { useServices } from "@/features/catalog/hooks/useCatalog";
import {
  useCancelSubscription,
  useCharges,
} from "@/features/club/hooks/useClubAdmin";
import { useClientClub } from "@/features/club/hooks/useClientClub";
import { middayIso } from "@/lib/calendar";
import { cn } from "@/lib/cn";
import { formatBRL, formatDate } from "@/lib/format";
import { SUBSCRIPTION_STATUS_LABEL } from "@/lib/labels";

const CHARGE_LABEL = {
  paid: "Paga",
  pending: "Pendente",
  failed: "Recusada",
} as const;

export function MyPlan() {
  const client = useAccountClient();
  const club = useClientClub(client.id);
  const charges = useCharges();
  const services = useServices();
  const cancel = useCancelSubscription();

  if (club.isLoading || charges.isLoading)
    return <Skeleton className="rounded-card h-64" />;
  if (club.isError) return <ErrorState />;

  const { subscription, plan } = club;
  if (!subscription || !plan || subscription.status === "canceled") {
    return (
      <EmptyState
        icon={Crown}
        title="Você ainda não é do Clube"
        description="Com o Clube, você paga um valor fixo por mês e corta quando precisar."
      >
        <Button asChild variant="primary">
          <Link href="/clube">Conhecer os planos</Link>
        </Button>
      </EmptyState>
    );
  }

  const end = formatDate(subscription.currentPeriodEnd, "dd/MM/yyyy");
  const history = (charges.data ?? [])
    .filter((c) => c.subscriptionId === subscription.id)
    .sort((a, b) => b.dueDate.localeCompare(a.dueDate));
  const statusTone =
    subscription.status === "active"
      ? "bg-success/12"
      : subscription.status === "past_due"
        ? "bg-danger/10 text-danger"
        : "bg-surface-2";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold">Plano {plan.name}</h1>
        <span
          className={cn(
            "rounded-control px-2 py-0.5 text-sm font-medium",
            statusTone,
          )}
        >
          {SUBSCRIPTION_STATUS_LABEL[subscription.status]}
        </span>
      </div>

      <section
        aria-labelledby="usage"
        className="rounded-card border-border bg-surface flex flex-col gap-2 border p-4"
      >
        <h2 id="usage" className="font-semibold">
          Uso neste período
        </h2>
        <ul className="flex flex-col gap-1">
          {plan.benefits.map((b) => (
            <li key={b.serviceId} className="flex justify-between gap-3">
              <span>
                {services.data?.find((s) => s.id === b.serviceId)?.name ??
                  "Serviço"}
              </span>
              <span className="tabular-nums">
                {remainingLabel(
                  b.monthlyLimit,
                  club.usage?.byService[b.serviceId] ?? 0,
                )}
              </span>
            </li>
          ))}
        </ul>
        <p className="text-text-muted text-sm">
          {subscription.status === "canceling"
            ? `Benefício vale até ${end}. Depois disso não há nova cobrança.`
            : `Próxima cobrança de ${formatBRL(plan.priceCents)} em ${end}, no ${subscription.paymentMethod === "pix" ? "Pix" : "cartão"}.`}
        </p>
      </section>

      <section aria-labelledby="charges" className="flex flex-col gap-2">
        <h2 id="charges" className="font-semibold">
          Cobranças
        </h2>
        {history.length === 0 ? (
          <p className="text-text-muted">Nenhuma cobrança ainda.</p>
        ) : (
          <ul className="divide-border rounded-card border-border bg-surface divide-y border">
            {history.map((c) => (
              <li key={c.id} className="flex justify-between gap-3 px-4 py-2">
                <span className="tabular-nums">
                  {formatDate(middayIso(c.dueDate), "dd/MM/yyyy")}
                </span>
                <span className="flex gap-3">
                  <span
                    className={cn(
                      "text-sm",
                      c.status === "failed" ? "text-danger" : "text-text-muted",
                    )}
                  >
                    {CHARGE_LABEL[c.status]}
                  </span>
                  <span className="tabular-nums">
                    {formatBRL(c.amountCents)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {subscription.status !== "canceling" && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" className="self-start">
              Cancelar assinatura
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancelar o plano {plan.name}?</AlertDialogTitle>
              <AlertDialogDescription>
                Não há nova cobrança. Seu benefício continua valendo até {end}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Manter assinatura</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={() =>
                  cancel.mutate(subscription.id, {
                    onSuccess: () =>
                      toast.success(
                        `Assinatura cancelada. Benefício até ${end}.`,
                      ),
                    onError: () =>
                      toast.error("Não foi possível cancelar. Tente de novo."),
                  })
                }
              >
                Cancelar assinatura
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
