"use client";

/** A8: ficha do cliente — cabeçalho, ações e abas (histórico, comandas, assinatura, observações, avaliações). */
import {
  ArrowLeft,
  CalendarPlus,
  Crown,
  MessageCircle,
  Pencil,
  Receipt,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { AppointmentStatusBadge } from "@/components/shared/AppointmentStatusBadge";
import { PersonAvatar } from "@/components/shared/PersonAvatar";
import { Stars } from "@/components/shared/Stars";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { clientStats } from "@/domain/metrics";
import { orderTotals } from "@/domain/order";
import { useAllAppointments } from "@/features/agenda/hooks/useAgenda";
import {
  useProfessionals,
  useReviews,
  useServices,
} from "@/features/catalog/hooks/useCatalog";
import { ClientFormDialog } from "@/features/clients/components/ClientFormDialog";
import { useClients } from "@/features/clients/hooks/useClients";
import { useClientClub } from "@/features/club/hooks/useClientClub";
import { useOpenWalkIn, useOrders } from "@/features/orders/hooks/useOrders";
import { useStaffMember } from "@/hooks/useSession";
import { middayIso } from "@/lib/calendar";
import { formatBRL, formatDate, formatPhone, formatTime } from "@/lib/format";
import {
  CLIENT_SOURCE_LABEL,
  SUBSCRIPTION_STATUS_LABEL,
  firstName,
} from "@/lib/labels";
import { whatsappLink } from "@/lib/whatsapp";

export function ClientDetail({ id }: { id: string }) {
  const router = useRouter();
  const clients = useClients();
  const appointments = useAllAppointments();
  const orders = useOrders();
  const services = useServices();
  const professionals = useProfessionals();
  const reviews = useReviews();
  const club = useClientClub(id);
  const openWalkIn = useOpenWalkIn();
  const { staff } = useStaffMember();
  const [editing, setEditing] = useState(false);

  if (clients.isError)
    return <ErrorState onRetry={() => void clients.refetch()} />;
  if (clients.isLoading || appointments.isLoading || orders.isLoading) {
    return <Skeleton className="rounded-card mx-auto h-96 max-w-4xl" />;
  }
  const client = clients.data?.find((c) => c.id === id);
  if (!client) {
    return (
      <EmptyState
        title="Cliente não encontrado"
        description="O cadastro pode ter sido excluído."
      >
        <Button asChild variant="secondary">
          <Link href="/admin/clientes">Ver clientes</Link>
        </Button>
      </EmptyState>
    );
  }

  const myApts = (appointments.data ?? [])
    .filter((a) => a.clientId === id)
    .sort((a, b) => b.start.localeCompare(a.start));
  const myOrders = (orders.data ?? [])
    .filter((o) => o.clientId === id)
    .sort((a, b) => b.openedAt.localeCompare(a.openedAt));
  const myReviews = (reviews.data ?? []).filter((r) => r.clientId === id);
  const stats = clientStats(myApts, myOrders).get(id);
  const serviceNames = (ids: string[]) =>
    ids
      .map((s) => services.data?.find((x) => x.id === s)?.name ?? "Serviço")
      .join(", ");
  const proName = (pid: string) =>
    firstName(professionals.data?.find((p) => p.id === pid)?.name ?? "");

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <Link
        href="/admin/clientes"
        className="text-text-muted hover:text-text inline-flex items-center gap-1 self-start text-sm"
      >
        <ArrowLeft className="size-4" strokeWidth={1.75} aria-hidden />
        Clientes
      </Link>

      <header className="flex flex-wrap items-start gap-4">
        <PersonAvatar name={client.name} size="lg" />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h1 className="flex flex-wrap items-center gap-2 text-2xl font-semibold break-words">
            {client.name}
            {club.active && club.plan && (
              <span className="bg-club text-club-fg inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium">
                <Crown className="size-3.5" strokeWidth={1.75} aria-hidden />
                {club.plan.name}
              </span>
            )}
          </h1>
          <p className="text-text-muted">
            <span className="tabular-nums">{formatPhone(client.phone)}</span>
            {client.birthday && (
              <>
                {" "}
                · aniversário {formatDate(middayIso(client.birthday), "dd/MM")}
              </>
            )}
            {client.source && (
              <> · veio por {CLIENT_SOURCE_LABEL[client.source]}</>
            )}
          </p>
          <p className="text-text-muted text-sm">
            {stats?.visits ?? 0} visitas · {formatBRL(stats?.spentCents ?? 0)}{" "}
            gastos
            {stats?.lastVisit && (
              <>
                {" "}
                · última em {formatDate(middayIso(stats.lastVisit), "dd/MM/yy")}
              </>
            )}
          </p>
          {client.tags.length > 0 && (
            <ul className="mt-1 flex flex-wrap gap-1">
              {client.tags.map((t) => (
                <li
                  key={t}
                  className="rounded-control bg-surface-2 px-2 py-0.5 text-xs"
                >
                  {t}
                </li>
              ))}
            </ul>
          )}
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <Link href="/admin/agenda">
            <CalendarPlus strokeWidth={1.75} aria-hidden />
            Agendar
          </Link>
        </Button>
        <Button
          variant="secondary"
          loading={openWalkIn.isPending}
          disabled={!staff}
          onClick={() =>
            staff &&
            openWalkIn.mutate(
              {
                clientId: client.id,
                professionalId: myApts[0]?.professionalId ?? staff.id,
              },
              {
                onSuccess: (order) =>
                  router.push(`/admin/comandas/${order.id}`),
                onError: () =>
                  toast.error(
                    "Não foi possível abrir a comanda. Tente de novo.",
                  ),
              },
            )
          }
        >
          <Receipt strokeWidth={1.75} aria-hidden />
          Abrir comanda
        </Button>
        <Button asChild variant="secondary">
          <a
            href={whatsappLink(client.phone, `Olá, ${firstName(client.name)}!`)}
            target="_blank"
            rel="noreferrer"
          >
            <MessageCircle strokeWidth={1.75} aria-hidden />
            WhatsApp
          </a>
        </Button>
        <Button variant="ghost" onClick={() => setEditing(true)}>
          <Pencil strokeWidth={1.75} aria-hidden />
          Editar cadastro
        </Button>
      </div>

      <Tabs defaultValue="history">
        <div className="-mx-4 overflow-x-auto px-4">
          <TabsList>
            <TabsTrigger value="history">Histórico</TabsTrigger>
            <TabsTrigger value="orders">Comandas</TabsTrigger>
            <TabsTrigger value="club">Assinatura</TabsTrigger>
            <TabsTrigger value="notes">Observações</TabsTrigger>
            <TabsTrigger value="reviews">Avaliações</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="history" className="pt-4">
          {myApts.length === 0 ? (
            <p className="text-text-muted">Nenhum atendimento ainda.</p>
          ) : (
            <ul className="divide-border rounded-card border-border bg-surface divide-y border">
              {myApts.slice(0, 30).map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <span className="min-w-0">
                    <span className="block tabular-nums">
                      {formatDate(a.start, "dd/MM/yy")} {formatTime(a.start)} ·{" "}
                      {proName(a.professionalId)}
                    </span>
                    <span className="text-text-muted block truncate text-sm">
                      {serviceNames(a.serviceIds)}
                    </span>
                  </span>
                  <AppointmentStatusBadge status={a.status} />
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="orders" className="pt-4">
          {myOrders.length === 0 ? (
            <p className="text-text-muted">Nenhuma comanda ainda.</p>
          ) : (
            <ul className="divide-border rounded-card border-border bg-surface divide-y border">
              {myOrders.slice(0, 30).map((o) => (
                <li key={o.id}>
                  <Link
                    href={`/admin/comandas/${o.id}`}
                    className="hover:bg-surface-2 flex justify-between gap-3 px-4 py-3"
                  >
                    <span className="tabular-nums">
                      {formatDate(o.closedAt ?? o.openedAt, "dd/MM/yy")}
                    </span>
                    <span className="text-text-muted truncate">
                      {o.items.map((i) => i.name).join(", ")}
                    </span>
                    <span className="tabular-nums">
                      {formatBRL(orderTotals(o).totalCents)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="club" className="pt-4">
          {club.subscription && club.plan ? (
            <dl className="rounded-card border-border bg-surface grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 border p-4 text-sm">
              <dt className="text-text-muted">Plano</dt>
              <dd>
                {club.plan.name} · {formatBRL(club.plan.priceCents)}/mês
              </dd>
              <dt className="text-text-muted">Status</dt>
              <dd>{SUBSCRIPTION_STATUS_LABEL[club.subscription.status]}</dd>
              <dt className="text-text-muted">Desde</dt>
              <dd className="tabular-nums">
                {formatDate(club.subscription.startedAt, "dd/MM/yyyy")}
              </dd>
              <dt className="text-text-muted">Período atual até</dt>
              <dd className="tabular-nums">
                {formatDate(club.subscription.currentPeriodEnd, "dd/MM/yyyy")}
              </dd>
            </dl>
          ) : (
            <p className="text-text-muted">Não é assinante do Clube.</p>
          )}
        </TabsContent>

        <TabsContent value="notes" className="pt-4">
          {client.notes ? (
            <p className="max-w-prose whitespace-pre-line">{client.notes}</p>
          ) : (
            <p className="text-text-muted">
              Sem observações. Use “Editar cadastro” para anotar preferências.
            </p>
          )}
        </TabsContent>

        <TabsContent value="reviews" className="pt-4">
          {myReviews.length === 0 ? (
            <p className="text-text-muted">Nenhuma avaliação deste cliente.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {myReviews.map((r) => (
                <li
                  key={r.id}
                  className="border-border flex flex-col gap-1 border-b pb-3"
                >
                  <span className="text-text-muted flex items-center gap-2 text-sm">
                    <Stars value={r.rating} />{" "}
                    {formatDate(r.createdAt, "dd/MM/yy")} ·{" "}
                    {proName(r.professionalId)}
                  </span>
                  {r.comment && <p>{r.comment}</p>}
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>

      {editing && (
        <ClientFormDialog
          client={client}
          mode="panel"
          onClose={() => setEditing(false)}
        />
      )}
    </div>
  );
}
