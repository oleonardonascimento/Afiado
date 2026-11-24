"use client";

import { useAllAppointments } from "@/features/agenda/hooks/useAgenda";
import {
  useProfessionals,
  useServices,
} from "@/features/catalog/hooks/useCatalog";
import { useClients } from "@/features/clients/hooks/useClients";
import { useSubscriptions } from "@/features/club/hooks/useClubAdmin";
import { useOrders } from "@/features/orders/hooks/useOrders";
import { averageTicketCents, revenueByDay } from "@/domain/metrics";
import { orderTotals } from "@/domain/order";
import {
  activeSubscribersAt,
  closedOrdersBetween,
  newClientsBySource,
  retention,
  revenueByPaymentMethod,
  revenueByProfessional,
  topServices,
} from "@/domain/reports";
import { addDays, addMonths, diffDays, todayIn } from "@/lib/calendar";

const MAX_DAILY_BARS = 62;

/** Junta os dados e calcula os relatórios do período (regras em domain/reports). */
export function useReports(from: string, to: string) {
  const queries = [
    useOrders(),
    useAllAppointments(),
    useClients(),
    useSubscriptions(),
    useServices(),
    useProfessionals(),
  ] as const;
  const [
    orders,
    appointments,
    clients,
    subscriptions,
    services,
    professionals,
  ] = queries;
  const isLoading = queries.some((q) => q.isLoading);
  const isError = queries.some((q) => q.isError);
  const refetch = () => queries.forEach((q) => void q.refetch());

  if (
    !orders.data ||
    !appointments.data ||
    !clients.data ||
    !subscriptions.data ||
    !services.data ||
    !professionals.data
  ) {
    return { isLoading, isError, refetch, data: null };
  }

  const today = todayIn(new Date());
  const inPeriod = closedOrdersBetween(orders.data, from, to);
  const span = diffDays(to, from) + 1;
  const days =
    span <= MAX_DAILY_BARS
      ? Array.from({ length: span }, (_, i) => addDays(from, i))
      : [];
  const monthEnds = Array.from({ length: 6 }, (_, i) => {
    const monthStart = addMonths(`${today.slice(0, 7)}-01`, i - 5);
    const end = addDays(addMonths(monthStart, 1), -1);
    return end > today ? today : end;
  });
  const serviceName = (id: string) =>
    services.data.find((s) => s.id === id)?.name ?? "Serviço removido";
  const proName = (id: string) =>
    professionals.data.find((p) => p.id === id)?.name ?? "Barbeiro";
  const clientName = (id: string | null) =>
    id ? (clients.data.find((c) => c.id === id)?.name ?? "Cliente") : "Avulso";

  return {
    isLoading,
    isError,
    refetch,
    data: {
      totalCents: inPeriod.reduce((s, o) => s + orderTotals(o).totalCents, 0),
      orderCount: inPeriod.length,
      averageTicketCents: averageTicketCents(inPeriod),
      byDay: revenueByDay(inPeriod, days),
      byMethod: revenueByPaymentMethod(inPeriod),
      byProfessional: revenueByProfessional(inPeriod).map((r) => ({
        ...r,
        name: proName(r.key),
      })),
      topServices: topServices(inPeriod, 8).map((r) => ({
        ...r,
        name: serviceName(r.serviceId),
      })),
      retention30: retention(appointments.data, from, to, 30),
      retention60: retention(appointments.data, from, to, 60),
      clubByMonth: monthEnds.map((date) => ({
        date,
        count: activeSubscribersAt(subscriptions.data, date),
      })),
      sources: newClientsBySource(clients.data, from, to),
      csvRows: inPeriod
        .sort((a, b) => (a.closedAt ?? "").localeCompare(b.closedAt ?? ""))
        .map((o) => ({
          order: o,
          client: clientName(o.clientId),
          professional: proName(o.professionalId),
        })),
    },
  };
}
