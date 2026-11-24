"use client";

import { useAllAppointments } from "@/features/agenda/hooks/useAgenda";
import {
  useProducts,
  useProfessionals,
  usePlans,
  useServices,
  useShop,
} from "@/features/catalog/hooks/useCatalog";
import { useClients } from "@/features/clients/hooks/useClients";
import { useSubscriptions } from "@/features/club/hooks/useClubAdmin";
import { useCommissions } from "@/features/commissions/hooks/useCommissions";
import { useOrders } from "@/features/orders/hooks/useOrders";
import {
  averageTicketCents,
  birthdaysBetween,
  groupSum,
  lapsedClients,
  lowStock,
  mrrCents,
  occupancyByProfessional,
  percentChange,
  revenueBetween,
  revenueByDay,
} from "@/domain/metrics";
import { addDays, addMonths, atTime, dateOf, todayIn } from "@/lib/calendar";
import { CLIENT_SOURCE_LABEL } from "@/lib/labels";

const LAPSED_DAYS = 45;

/** Junta os dados do painel e calcula os indicadores do dashboard (regras em domain/metrics). */
export function useDashboard() {
  const queries = {
    orders: useOrders(),
    appointments: useAllAppointments(),
    subscriptions: useSubscriptions(),
    plans: usePlans(),
    clients: useClients(),
    products: useProducts(),
    professionals: useProfessionals(),
    services: useServices(),
    shop: useShop(),
    commissions: useCommissions(),
  };
  const all = Object.values(queries);
  const isLoading = all.some((q) => q.isLoading);
  const isError = all.some((q) => q.isError);
  const refetch = () => all.forEach((q) => void q.refetch());

  const {
    orders,
    appointments,
    subscriptions,
    plans,
    clients,
    products,
    professionals,
    shop,
  } = queries;
  if (
    !orders.data ||
    !appointments.data ||
    !subscriptions.data ||
    !plans.data ||
    !clients.data ||
    !products.data ||
    !professionals.data ||
    !shop.data ||
    !queries.services.data ||
    !queries.commissions.data
  ) {
    return { isLoading, isError, refetch, data: null };
  }

  const now = new Date();
  const today = todayIn(now);
  const startOf = (date: string) => atTime(date, "00:00");
  const monthStart = `${today.slice(0, 7)}-01`;
  const prevMonthStart = addMonths(monthStart, -1);
  const prevMonthSameDay = addDays(addMonths(today, -1), 1);
  const monthOrders = orders.data.filter(
    (o) => o.closedAt && o.closedAt >= startOf(monthStart),
  );
  const todayApts = appointments.data
    .filter((a) => dateOf(a.start) === today)
    .sort((a, b) => a.start.localeCompare(b.start));
  const last30 = Array.from({ length: 30 }, (_, i) => addDays(today, i - 29));
  const last7 = last30.slice(-7);

  const revenueToday = revenueBetween(
    orders.data,
    startOf(today),
    startOf(addDays(today, 1)),
  );
  const revenueYesterday = revenueBetween(
    orders.data,
    startOf(addDays(today, -1)),
    startOf(today),
  );
  const revenueMonth = revenueBetween(
    orders.data,
    startOf(monthStart),
    startOf(addDays(today, 1)),
  );
  const revenuePrevMonth = revenueBetween(
    orders.data,
    startOf(prevMonthStart),
    startOf(prevMonthSameDay),
  );

  const occupancyToday = occupancyByProfessional(
    appointments.data,
    shop.data,
    professionals.data,
    [today],
  );
  const avgOccupancyToday =
    occupancyToday.length === 0
      ? 0
      : Math.round(
          occupancyToday.reduce((s, o) => s + o.pct, 0) / occupancyToday.length,
        );

  return {
    isLoading,
    isError,
    refetch,
    data: {
      today,
      revenueToday,
      revenueTodayChange: percentChange(revenueToday, revenueYesterday),
      revenueMonth,
      revenueMonthChange: percentChange(revenueMonth, revenuePrevMonth),
      todayDone: todayApts.filter((a) => a.status === "done").length,
      todayRemaining: todayApts.filter((a) =>
        ["scheduled", "confirmed", "in_service"].includes(a.status),
      ).length,
      occupancyToday: avgOccupancyToday,
      noShowsMonth: appointments.data.filter(
        (a) => a.status === "no_show" && a.start >= startOf(monthStart),
      ).length,
      averageTicket: averageTicketCents(monthOrders),
      activeSubscribers: subscriptions.data.filter(
        (s) => s.status === "active" || s.status === "canceling",
      ).length,
      mrr: mrrCents(subscriptions.data, plans.data),
      pastDue: subscriptions.data.filter((s) => s.status === "past_due").length,
      revenue30: revenueByDay(orders.data, last30),
      occupancyWeek: occupancyByProfessional(
        appointments.data,
        shop.data,
        professionals.data,
        last7,
      ),
      sources: groupSum(
        clients.data,
        (c) => (c.source ? CLIENT_SOURCE_LABEL[c.source] : "Não informado"),
        () => 1,
      ),
      upcoming: todayApts
        .filter((a) =>
          ["scheduled", "confirmed", "in_service"].includes(a.status),
        )
        .slice(0, 6),
      birthdays: birthdaysBetween(clients.data, today, addDays(today, 6)).slice(
        0,
        6,
      ),
      lapsed: lapsedClients(
        clients.data,
        appointments.data,
        today,
        LAPSED_DAYS,
      ).slice(0, 6),
      lowStock: lowStock(products.data),
      clients: clients.data,
      professionals: professionals.data,
      services: queries.services.data,
      appointments: appointments.data,
      commissions: queries.commissions.data,
      monthStartIso: startOf(monthStart),
    },
  };
}
