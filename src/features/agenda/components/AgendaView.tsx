"use client";

/**
 * A3: agenda. Estado na URL: ?data=AAAA-MM-DD&visao=dia|semana&barbeiro=<id>.
 * Barbeiro logado vê só a própria coluna.
 */
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { ErrorState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { isSubscriptionActive } from "@/domain/subscription";
import { AppointmentSheet } from "@/features/agenda/components/AppointmentSheet";
import { DayGrid } from "@/features/agenda/components/DayGrid";
import { NewEntryDialog, type NewEntryDraft } from "@/features/agenda/components/NewEntryDialog";
import { WeekList } from "@/features/agenda/components/WeekList";
import { useAppointmentsRange } from "@/features/agenda/hooks/useAgenda";
import { useProfessionals, useServices, useShop, useTimeOff } from "@/features/catalog/hooks/useCatalog";
import { useClients } from "@/features/clients/hooks/useClients";
import { useSubscriptions } from "@/features/club/hooks/useClubAdmin";
import { useStaffMember } from "@/hooks/useSession";
import { addDays, atTime, middayIso, todayIn, weekdayOf } from "@/lib/calendar";
import { formatDate } from "@/lib/format";
import { capitalizeFirst } from "@/lib/labels";

const ALL = "todos";

export function AgendaView() {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const today = todayIn(new Date());
  const date = /^\d{4}-\d{2}-\d{2}$/.test(search.get("data") ?? "") ? (search.get("data") as string) : today;
  const view = search.get("visao") === "semana" ? "week" : "day";
  const { role, staff } = useStaffMember();
  const barberFilter = role === "barber" ? (staff?.id ?? ALL) : (search.get("barbeiro") ?? ALL);

  const weekStart = addDays(date, -((weekdayOf(date) + 6) % 7));
  const from = view === "day" ? date : weekStart;
  const to = view === "day" ? addDays(date, 1) : addDays(weekStart, 7);
  const appointments = useAppointmentsRange(atTime(from, "00:00"), atTime(to, "00:00"));
  const professionals = useProfessionals();
  const services = useServices();
  const clients = useClients();
  const shop = useShop();
  const timeOff = useTimeOff();
  const subscriptions = useSubscriptions();

  const [openId, setOpenId] = useState<string | null>(null);
  const [draft, setDraft] = useState<NewEntryDraft | null>(null);

  const setParams = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(search.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === null) next.delete(k);
      else next.set(k, v);
    }
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  };

  const team = (professionals.data ?? []).filter((p) => p.active && p.serviceIds.length > 0);
  const columns = barberFilter === ALL ? team : team.filter((p) => p.id === barberFilter);
  const now = new Date();
  const clubClients = new Set(
    (subscriptions.data ?? []).filter((s) => isSubscriptionActive(s, now)).map((s) => s.clientId),
  );
  const visible = (appointments.data ?? []).filter((a) => columns.some((c) => c.id === a.professionalId));
  const step = view === "day" ? 1 : 7;
  const title =
    view === "day"
      ? capitalizeFirst(formatDate(middayIso(date), "EEEE, dd 'de' MMMM"))
      : `Semana de ${formatDate(middayIso(weekStart), "dd/MM")} a ${formatDate(middayIso(addDays(weekStart, 6)), "dd/MM")}`;

  const isLoading =
    appointments.isLoading || professionals.isLoading || shop.isLoading || clients.isLoading || services.isLoading;
  const isError = appointments.isError || professionals.isError || shop.isError;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4">
      <PageHeader title="Agenda">
        <Button
          onClick={() =>
            setDraft({ date, time: null, professionalId: barberFilter === ALL ? null : barberFilter, mode: "appointment" })
          }
        >
          <Plus strokeWidth={1.75} aria-hidden />
          Novo agendamento
        </Button>
      </PageHeader>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          <Button variant="secondary" size="icon" aria-label="Período anterior" onClick={() => setParams({ data: addDays(date, -step) })}>
            <ChevronLeft strokeWidth={1.75} aria-hidden />
          </Button>
          <Button variant="secondary" onClick={() => setParams({ data: null })} disabled={date === today}>
            Hoje
          </Button>
          <Button variant="secondary" size="icon" aria-label="Próximo período" onClick={() => setParams({ data: addDays(date, step) })}>
            <ChevronRight strokeWidth={1.75} aria-hidden />
          </Button>
        </div>
        <h2 className="min-w-0 flex-1 text-lg font-semibold" aria-live="polite">
          {title}
        </h2>
        <Tabs value={view} onValueChange={(v) => setParams({ visao: v === "week" ? "semana" : null })}>
          <TabsList>
            <TabsTrigger value="day">Dia</TabsTrigger>
            <TabsTrigger value="week">Semana</TabsTrigger>
          </TabsList>
        </Tabs>
        {role !== "barber" && (
          <Select value={barberFilter} onValueChange={(v) => setParams({ barbeiro: v === ALL ? null : v })}>
            <SelectTrigger className="w-44" aria-label="Filtrar por barbeiro">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todos os barbeiros</SelectItem>
              {team.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {isError ? (
        <ErrorState onRetry={() => void appointments.refetch()} />
      ) : isLoading || !shop.data ? (
        <Skeleton className="h-128 rounded-card" />
      ) : view === "day" ? (
        <DayGrid
          date={date}
          shop={shop.data}
          columns={columns}
          appointments={visible.filter((a) => a.status !== "canceled")}
          timeOff={(timeOff.data ?? []).filter((t) => columns.some((c) => c.id === t.professionalId))}
          clients={clients.data ?? []}
          services={services.data ?? []}
          clubClients={clubClients}
          onOpen={setOpenId}
          onEmpty={(professionalId, time) => setDraft({ date, time, professionalId, mode: "appointment" })}
        />
      ) : (
        <WeekList
          weekStart={weekStart}
          appointments={visible}
          clients={clients.data ?? []}
          professionals={team}
          clubClients={clubClients}
          onOpen={setOpenId}
          onDay={(d) => setParams({ data: d, visao: null })}
        />
      )}

      <AppointmentSheet
        appointmentId={openId}
        appointments={appointments.data ?? []}
        onClose={() => setOpenId(null)}
        clubClients={clubClients}
      />
      {draft && <NewEntryDialog draft={draft} team={team} onClose={() => setDraft(null)} />}
    </div>
  );
}
