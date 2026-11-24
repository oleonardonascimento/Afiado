"use client";

import { useCurrentClient } from "@/features/auth/hooks/useClientAuth";
import { useServices } from "@/features/catalog/hooks/useCatalog";
import { useClientClub } from "@/features/club/hooks/useClientClub";
import { coveredServiceIds, bookingTotals } from "@/domain/subscription";
import { todayIn } from "@/lib/calendar";

/**
 * Resumo do agendamento: duração, preço e o que sai pelo Clube (RF-03, RF-11).
 * `date` é o dia escolhido (ou hoje, antes de escolher).
 */
export function useBookingQuote(serviceIds: string[], date: string | null) {
  const services = useServices();
  const { client } = useCurrentClient();
  const club = useClientClub(client?.id ?? null);

  const chosen = (services.data ?? []).filter((s) => serviceIds.includes(s.id));
  const covered =
    club.active && club.plan && club.usage
      ? coveredServiceIds(club.plan, club.usage, serviceIds, date ?? todayIn(new Date()))
      : [];
  return {
    chosen,
    coveredIds: covered,
    totals: bookingTotals(chosen, covered),
    club,
  };
}
