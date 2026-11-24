"use client";

import { useQuery } from "@tanstack/react-query";
import { repos } from "@/data";
import { availableSlots, type Slot } from "@/domain/availability";
import {
  useProfessionals,
  useServices,
  useShop,
  useTimeOff,
} from "@/features/catalog/hooks/useCatalog";
import { addDays, atTime, todayIn, weekdayOf } from "@/lib/calendar";
import { appointmentKeys } from "@/lib/query-keys";

export const BOOKING_DAYS = 14;

type Params = {
  serviceIds: string[];
  professionalId: string | null;
  ignoreAppointmentId?: string;
};

/** "closed" = barbearia fechada; "off" = barbeiro escolhido não trabalha no dia. */
export type DayAvailability = {
  date: string;
  slots: Slot[];
  status: "open" | "closed" | "off";
};

/** Horários livres dos próximos 14 dias para os serviços e barbeiro escolhidos. */
export function useBookingAvailability({
  serviceIds,
  professionalId,
  ignoreAppointmentId,
}: Params) {
  const shop = useShop();
  const services = useServices();
  const professionals = useProfessionals();
  const timeOff = useTimeOff();
  const now = new Date();
  const today = todayIn(now);
  const last = addDays(today, BOOKING_DAYS);
  const from = atTime(today, "00:00");
  const to = atTime(last, "00:00");
  const appointments = useQuery({
    queryKey: appointmentKeys.range(from, to),
    queryFn: () => repos.appointments.listByRange(from, to),
    enabled: serviceIds.length > 0,
  });

  const ready =
    shop.data &&
    services.data &&
    professionals.data &&
    timeOff.data &&
    appointments.data;

  const days: DayAvailability[] = ready
    ? Array.from({ length: BOOKING_DAYS }, (_, i) => {
        const date = addDays(today, i);
        const weekday = weekdayOf(date);
        const shopClosed =
          shop.data.closures.some((c) => c.date === date) ||
          (shop.data.hours.find((h) => h.weekday === weekday)?.ranges.length ??
            0) === 0;
        const pro = professionals.data.find((p) => p.id === professionalId);
        const proOff =
          !!pro &&
          (pro.hours.find((h) => h.weekday === weekday)?.ranges.length ?? 0) ===
            0;
        return {
          date,
          status: shopClosed ? "closed" : proOff ? "off" : "open",
          slots: availableSlots({
            date,
            serviceIds,
            professionalId,
            shop: shop.data,
            professionals: professionals.data,
            services: services.data,
            appointments: appointments.data,
            timeOff: timeOff.data,
            now,
            ignoreAppointmentId,
          }),
        };
      })
    : [];

  return {
    days,
    isLoading: !ready && !appointments.isError,
    isError:
      shop.isError ||
      services.isError ||
      professionals.isError ||
      appointments.isError,
    refetch: () => void appointments.refetch(),
  };
}
