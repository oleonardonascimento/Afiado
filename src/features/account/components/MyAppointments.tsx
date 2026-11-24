"use client";

import { CalendarX } from "lucide-react";
import Link from "next/link";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAccountClient } from "@/features/account/components/AccountShell";
import { AppointmentItem } from "@/features/account/components/AppointmentItem";
import { useClientAppointments } from "@/features/account/hooks/useMyAppointments";
import { useProfessionals, useReviews, useServices, useShop } from "@/features/catalog/hooks/useCatalog";

const UPCOMING = new Set(["scheduled", "confirmed", "in_service"]);

/** C9: abas Próximos / Histórico. */
export function MyAppointments() {
  const client = useAccountClient();
  const appointments = useClientAppointments(client.id);
  const services = useServices();
  const professionals = useProfessionals();
  const reviews = useReviews();
  const shop = useShop();

  if (appointments.isLoading || services.isLoading) {
    return <Skeleton className="h-40 rounded-card" />;
  }
  if (appointments.isError) return <ErrorState onRetry={() => void appointments.refetch()} />;

  const list = appointments.data ?? [];
  const upcoming = list.filter((a) => UPCOMING.has(a.status)).sort((a, b) => a.start.localeCompare(b.start));
  const history = list.filter((a) => !UPCOMING.has(a.status)).sort((a, b) => b.start.localeCompare(a.start));
  const reviewed = new Set((reviews.data ?? []).map((r) => r.appointmentId));

  const render = (items: typeof list, empty: React.ReactNode) =>
    items.length === 0 ? (
      empty
    ) : (
      <ul className="flex flex-col gap-3">
        {items.map((a) => (
          <li key={a.id}>
            <AppointmentItem
              appointment={a}
              services={services.data ?? []}
              professional={professionals.data?.find((p) => p.id === a.professionalId)}
              deadlineHours={shop.data?.booking.cancelDeadlineHours ?? 3}
              reviewed={reviewed.has(a.id)}
            />
          </li>
        ))}
      </ul>
    );

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Meus agendamentos</h1>
      <Tabs defaultValue="next">
        <TabsList>
          <TabsTrigger value="next">Próximos ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>
        <TabsContent value="next" className="pt-4">
          {render(
            upcoming,
            <EmptyState
              icon={CalendarX}
              title="Nenhum horário marcado"
              description="Quando você agendar, o horário aparece aqui com as opções de remarcar e cancelar."
            >
              <Button asChild variant="primary">
                <Link href="/agendar">Agendar horário</Link>
              </Button>
            </EmptyState>,
          )}
        </TabsContent>
        <TabsContent value="history" className="pt-4">
          {render(
            history,
            <EmptyState title="Ainda sem histórico" description="Seus atendimentos concluídos e cancelados aparecem aqui." />,
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
