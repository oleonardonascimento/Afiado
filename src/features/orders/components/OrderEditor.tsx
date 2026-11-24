"use client";

/** A5: comanda — itens, Clube automático, desconto, pagamento, troco, comissão prevista e fechamento. */
import { ArrowLeft, Crown } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { MoneyInput } from "@/components/shared/MoneyInput";
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
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { OperationError } from "@/data/repositories";
import { commissionForItem } from "@/domain/commission";
import type { Order, OrderItem } from "@/domain/entities";
import {
  applyClubBenefit,
  closeOrderProblem,
  orderTotals,
} from "@/domain/order";
import { remainingLabel } from "@/domain/subscription";
import { useOpenCashSession } from "@/features/cash/hooks/useCash";
import {
  useProducts,
  useProfessionals,
  useServices,
} from "@/features/catalog/hooks/useCatalog";
import { useClients } from "@/features/clients/hooks/useClients";
import { useClientClub } from "@/features/club/hooks/useClientClub";
import { OrderItems } from "@/features/orders/components/OrderItems";
import {
  OrderPayments,
  type PaymentDraft,
} from "@/features/orders/components/OrderPayments";
import {
  useCancelOrder,
  useCloseOrder,
  useOrders,
  useUpdateOrder,
} from "@/features/orders/hooks/useOrders";
import { useStaffMember } from "@/hooks/useSession";
import { todayIn } from "@/lib/calendar";
import { formatBRL, formatDate, formatTime } from "@/lib/format";
import { PAYMENT_METHOD_LABEL } from "@/lib/labels";

export function OrderEditor({ id }: { id: string }) {
  const orders = useOrders();
  const order = orders.data?.find((o) => o.id === id);
  if (orders.isLoading)
    return <Skeleton className="rounded-card mx-auto h-96 max-w-4xl" />;
  if (orders.isError)
    return <ErrorState onRetry={() => void orders.refetch()} />;
  if (!order) {
    return (
      <EmptyState
        title="Comanda não encontrada"
        description="Ela pode ter sido removida ao resetar a demonstração."
      >
        <Button asChild variant="secondary">
          <Link href="/admin/comandas">Ver comandas</Link>
        </Button>
      </EmptyState>
    );
  }
  return <OrderForm key={`${order.id}-${order.status}`} order={order} />;
}

function OrderForm({ order }: { order: Order }) {
  const services = useServices();
  const products = useProducts();
  const professionals = useProfessionals();
  const clients = useClients();
  const club = useClientClub(order.clientId);
  const cash = useOpenCashSession();
  const { role } = useStaffMember();
  const update = useUpdateOrder();
  const close = useCloseOrder();
  const cancel = useCancelOrder();
  const orders = useOrders();

  const readOnly = order.status !== "open";
  const [items, setItems] = useState<OrderItem[]>(order.items);
  const [discountCents, setDiscountCents] = useState(order.discountCents);
  const [payments, setPayments] = useState<PaymentDraft[]>(
    order.payments.length > 0
      ? order.payments.map((p) => ({ key: crypto.randomUUID(), ...p }))
      : [{ key: crypto.randomUUID(), method: "pix", amountCents: null }],
  );

  const client = clients.data?.find((c) => c.id === order.clientId);
  const pro = professionals.data?.find((p) => p.id === order.professionalId);
  const paid = payments.map((p) => ({
    method: p.method,
    amountCents: p.amountCents ?? 0,
  }));
  const draft: Order = { ...order, items, discountCents, payments: paid };
  const totals = orderTotals(draft);
  const problem = closeOrderProblem(draft, Boolean(cash.session));
  const dirty =
    JSON.stringify(items) !== JSON.stringify(order.items) ||
    discountCents !== order.discountCents;

  /** Novos serviços passam pelo benefício do Clube quando o cliente é assinante. */
  const changeItems = (next: OrderItem[]) => {
    if (club.active && club.plan && club.usage) {
      setItems(
        applyClubBenefit(next, club.plan, club.usage, todayIn(new Date())),
      );
    } else setItems(next);
  };

  const commissions = items.map((item) => {
    const itemPro = professionals.data?.find(
      (p) => p.id === item.professionalId,
    );
    const pct =
      item.kind === "service"
        ? (services.data?.find((s) => s.id === item.refId)?.commissionPct ?? 0)
        : (products.data?.find((p) => p.id === item.refId)?.commissionPct ?? 0);
    return itemPro ? commissionForItem(item, itemPro, pct).amountCents : 0;
  });
  const commissionTotal = commissions.reduce((a, b) => a + b, 0);

  const save = () =>
    update.mutate(
      { id: order.id, patch: { items, discountCents } },
      {
        onSuccess: () => toast.success("Comanda salva"),
        onError: () => toast.error("Não foi possível salvar. Tente de novo."),
      },
    );

  const closeOrder = () =>
    update.mutate(
      { id: order.id, patch: { items, discountCents } },
      {
        onSuccess: () =>
          close.mutate(
            { id: order.id, payments: paid.filter((p) => p.amountCents > 0) },
            {
              onSuccess: () =>
                toast.success(
                  totals.changeCents > 0
                    ? `Comanda fechada. Troco: ${formatBRL(totals.changeCents)}`
                    : "Comanda fechada",
                ),
              onError: (e) => {
                toast.error(
                  e instanceof OperationError
                    ? e.message
                    : "Não foi possível fechar. Tente de novo.",
                );
                // O mock pode ter corrigido a cobertura do Clube: traz os itens atualizados.
                void orders.refetch().then(({ data }) => {
                  const fresh = data?.find((o) => o.id === order.id);
                  if (fresh) setItems(fresh.items);
                });
              },
            },
          ),
        onError: () =>
          toast.error("Não foi possível salvar os itens. Tente de novo."),
      },
    );

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <Link
        href="/admin/comandas"
        className="text-text-muted hover:text-text inline-flex items-center gap-1 self-start text-sm"
      >
        <ArrowLeft className="size-4" strokeWidth={1.75} aria-hidden />
        Comandas
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            {client?.name ?? "Comanda avulsa"}
            {club.active && (
              <span className="bg-club text-club-fg inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium">
                <Crown className="size-3.5" strokeWidth={1.75} aria-hidden />
                Clube
              </span>
            )}
          </h1>
          <p className="text-text-muted">
            {pro?.name ?? "Barbeiro"} · aberta em{" "}
            {formatDate(order.openedAt, "dd/MM")} às{" "}
            {formatTime(order.openedAt)}
          </p>
          {club.active && club.plan && club.usage && (
            <p className="text-text-muted text-sm">
              Plano {club.plan.name} neste período:{" "}
              {club.plan.benefits
                .map(
                  (b) =>
                    `${services.data?.find((s) => s.id === b.serviceId)?.name ?? "Serviço"} ${remainingLabel(b.monthlyLimit, club.usage?.byService[b.serviceId] ?? 0)}`,
                )
                .join(" · ")}
            </p>
          )}
        </div>
        <span className="rounded-control bg-surface-2 px-2 py-1 text-sm">
          {order.status === "open"
            ? "Aberta"
            : order.status === "closed"
              ? "Fechada"
              : "Cancelada"}
        </span>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <OrderItems
            items={items}
            services={services.data ?? []}
            products={products.data ?? []}
            professionalId={order.professionalId}
            readOnly={readOnly}
            onChange={changeItems}
          />
          {!readOnly && (
            <OrderPayments
              payments={payments}
              remainingCents={totals.remainingCents}
              onChange={setPayments}
            />
          )}
          {readOnly && order.payments.length > 0 && (
            <section className="flex flex-col gap-2">
              <h2 className="text-lg font-semibold">Pagamento</h2>
              <ul className="text-sm">
                {order.payments.map((p, i) => (
                  <li key={`${p.method}-${i}`} className="flex justify-between">
                    <span>{PAYMENT_METHOD_LABEL[p.method]}</span>
                    <span className="tabular-nums">
                      {formatBRL(p.amountCents)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside className="rounded-card border-border bg-surface flex flex-col gap-4 self-start border p-4 lg:sticky lg:top-20">
          <dl className="flex flex-col gap-2 text-sm">
            <Row label="Subtotal" value={formatBRL(totals.grossCents)} />
            {totals.clubCents > 0 && (
              <Row label="Clube" value={`−${formatBRL(totals.clubCents)}`} />
            )}
            {totals.itemDiscountCents > 0 && (
              <Row
                label="Descontos nos itens"
                value={`−${formatBRL(totals.itemDiscountCents)}`}
              />
            )}
            {!readOnly ? (
              <div className="flex items-center justify-between gap-2">
                <Label
                  htmlFor="order-discount"
                  className="text-text-muted font-normal"
                >
                  Desconto no total
                </Label>
                <MoneyInput
                  id="order-discount"
                  className="w-32"
                  value={discountCents || null}
                  onChange={(c) => setDiscountCents(c ?? 0)}
                />
              </div>
            ) : (
              totals.orderDiscountCents > 0 && (
                <Row
                  label="Desconto no total"
                  value={`−${formatBRL(totals.orderDiscountCents)}`}
                />
              )
            )}
            <div className="border-border flex justify-between border-t pt-2 text-lg font-semibold">
              <dt>Total</dt>
              <dd className="tabular-nums">{formatBRL(totals.totalCents)}</dd>
            </div>
            {!readOnly && (
              <>
                <Row label="Recebido" value={formatBRL(totals.paidCents)} />
                {totals.remainingCents > 0 && (
                  <Row label="Falta" value={formatBRL(totals.remainingCents)} />
                )}
                {totals.changeCents > 0 && (
                  <Row
                    label="Troco"
                    value={formatBRL(totals.changeCents)}
                    strong
                  />
                )}
              </>
            )}
          </dl>

          {role === "owner" && (
            <p className="border-border text-text-muted border-t pt-3 text-sm">
              Comissão de {pro?.name.split(" ")[0] ?? "barbeiro"}:{" "}
              <span className="text-text tabular-nums">
                {formatBRL(commissionTotal)}
              </span>
            </p>
          )}

          {!readOnly && (
            <div className="flex flex-col gap-2">
              {problem && (
                <p className="text-text-muted text-sm" role="status">
                  {problem}{" "}
                  {!cash.session && (
                    <Link
                      href="/admin/caixa"
                      className="text-text underline underline-offset-4"
                    >
                      Ir para o caixa
                    </Link>
                  )}
                </p>
              )}
              <Button
                disabled={Boolean(problem)}
                loading={close.isPending}
                onClick={closeOrder}
              >
                Fechar comanda
              </Button>
              <Button
                variant="secondary"
                disabled={!dirty}
                loading={update.isPending && !close.isPending}
                onClick={save}
              >
                Salvar sem fechar
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost">Cancelar comanda</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancelar esta comanda?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Nada é cobrado e nenhuma comissão é gerada. Use quando a
                      comanda foi aberta por engano.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Manter comanda</AlertDialogCancel>
                    <AlertDialogAction
                      variant="destructive"
                      onClick={() =>
                        cancel.mutate(order.id, {
                          onSuccess: () => toast.success("Comanda cancelada"),
                          onError: () =>
                            toast.error(
                              "Não foi possível cancelar. Tente de novo.",
                            ),
                        })
                      }
                    >
                      Cancelar comanda
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <dt className="text-text-muted">{label}</dt>
      <dd className={strong ? "font-semibold tabular-nums" : "tabular-nums"}>
        {value}
      </dd>
    </div>
  );
}
