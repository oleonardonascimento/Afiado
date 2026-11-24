"use client";

import { CalendarPlus, CircleCheck, Crown, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fillTemplate } from "@/domain/booking-policy";
import { useAppointment } from "@/features/account/hooks/useMyAppointments";
import { useCurrentClient } from "@/features/auth/hooks/useClientAuth";
import { usePlans, useProfessionals, useServices, useShop } from "@/features/catalog/hooks/useCatalog";
import { useClientClub } from "@/features/club/hooks/useClientClub";
import { buildIcs } from "@/lib/ics";
import { formatBRL, formatDate, formatTime } from "@/lib/format";
import { capitalizeFirst, firstName } from "@/lib/labels";
import { whatsappLink } from "@/lib/whatsapp";

/** C3: confirmação com resumo, calendário, WhatsApp e card discreto do Clube. */
export function BookingConfirmation() {
  const params = useSearchParams();
  const id = params.get("id");
  const rescheduled = params.get("remarcado") === "1";
  const appointment = useAppointment(id);
  const services = useServices();
  const professionals = useProfessionals();
  const shop = useShop();
  const plans = usePlans();
  const { client } = useCurrentClient();
  const club = useClientClub(client?.id ?? null);

  if (appointment.isLoading || services.isLoading || shop.isLoading) {
    return <Skeleton className="h-96 rounded-card" />;
  }
  if (appointment.isError) return <ErrorState onRetry={() => void appointment.refetch()} />;
  const apt = appointment.data;
  if (!apt || !shop.data) {
    return (
      <EmptyState title="Agendamento não encontrado" description="Veja seus horários em Minha conta.">
        <Button asChild variant="secondary">
          <Link href="/conta/agendamentos">Ver meus agendamentos</Link>
        </Button>
      </EmptyState>
    );
  }

  const chosen = (services.data ?? []).filter((s) => apt.serviceIds.includes(s.id));
  const pro = professionals.data?.find((p) => p.id === apt.professionalId);
  const when = `${formatDate(apt.start, "EEEE, dd/MM")} às ${formatTime(apt.start)}`;
  const address = `${shop.data.address.street}, ${shop.data.address.district}, ${shop.data.address.city}/${shop.data.address.state}`;
  const message = fillTemplate(shop.data.messages.confirmation, {
    nome: client ? firstName(client.name) : "",
    data: formatDate(apt.start, "dd/MM"),
    hora: formatTime(apt.start),
  });
  const clubPlan =
    !club.active && plans.data?.find((p) => p.active && p.benefits.some((b) => apt.serviceIds.includes(b.serviceId)));

  const downloadIcs = () => {
    const ics = buildIcs({
      uid: `${apt.id}@afiado`,
      start: apt.start,
      end: apt.end,
      title: `${chosen.map((s) => s.name).join(", ")} na ${shop.data.name}`,
      location: address,
      description: pro ? `Com ${pro.name}` : "",
    });
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "agendamento-afiado.ics";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-start gap-2">
        <CircleCheck className="size-10 text-success" strokeWidth={1.75} aria-hidden />
        <h1 className="text-2xl font-semibold">{rescheduled ? "Horário remarcado" : "Horário marcado"}</h1>
        <p className="text-lg">
          {capitalizeFirst(when)}
          {pro && <> com {pro.name}</>}
        </p>
      </div>
      <dl className="grid gap-3 rounded-card border border-border bg-surface p-4">
        <div>
          <dt className="text-sm text-text-muted">Serviços</dt>
          <dd>{chosen.map((s) => s.name).join(", ")}</dd>
        </div>
        <div>
          <dt className="text-sm text-text-muted">Valor de tabela</dt>
          <dd className="tabular-nums">{formatBRL(apt.priceCents)} · pagamento na barbearia</dd>
        </div>
        <div>
          <dt className="text-sm text-text-muted">Endereço</dt>
          <dd>{address}</dd>
        </div>
      </dl>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button variant="secondary" onClick={downloadIcs}>
          <CalendarPlus strokeWidth={1.75} aria-hidden />
          Adicionar ao calendário
        </Button>
        <Button asChild variant="secondary">
          <a href={whatsappLink(shop.data.whatsapp, message)} target="_blank" rel="noopener noreferrer">
            <MessageCircle strokeWidth={1.75} aria-hidden />
            Abrir no WhatsApp
          </a>
        </Button>
        <Button asChild variant="primary">
          <Link href="/conta/agendamentos">Ver meus agendamentos</Link>
        </Button>
      </div>
      {clubPlan && (
        <aside className="flex items-start gap-3 rounded-card bg-club p-4 text-club-fg">
          <Crown className="mt-0.5 size-5 shrink-0" strokeWidth={1.75} aria-hidden />
          <p className="text-sm">
            No Clube {clubPlan.name}, este horário sairia por R$ 0.{" "}
            <Link href="/clube" className="font-medium underline underline-offset-4">
              Conhecer os planos
            </Link>
          </p>
        </aside>
      )}
    </div>
  );
}
