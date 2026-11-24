"use client";

/**
 * Fluxo de agendamento (C2). Serviços → Profissional → Data e horário →
 * Identificação (pula se logado) → Revisão. Escolher barbeiro e horário já
 * avança de passo, para caber em 4 toques depois do serviço.
 * Query params: ?servicos=svc-1,svc-3 · ?profissional=pro-2 · ?remarcar=<id>
 */
import { ArrowLeft } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SlotTakenError } from "@/data/repositories";
import { PhoneSignIn } from "@/features/auth/components/PhoneSignIn";
import { useCurrentClient } from "@/features/auth/hooks/useClientAuth";
import { BookingProgress } from "@/features/booking/components/BookingProgress";
import { BookingSummaryBar } from "@/features/booking/components/BookingSummaryBar";
import { DateTimeStep } from "@/features/booking/components/DateTimeStep";
import { ProfessionalStep } from "@/features/booking/components/ProfessionalStep";
import { ReviewStep } from "@/features/booking/components/ReviewStep";
import { ServicesStep } from "@/features/booking/components/ServicesStep";
import { BOOKING_STEPS, useBookingStore, type BookingStep } from "@/features/booking/booking-store";
import { useBookAppointment, useRescheduleAppointment } from "@/features/booking/hooks/useBookingMutations";
import { useBookingQuote } from "@/features/booking/hooks/useBookingQuote";

export function BookingFlow() {
  const router = useRouter();
  const params = useSearchParams();
  const store = useBookingStore();
  const { client } = useCurrentClient();
  const quote = useBookingQuote(store.serviceIds, store.date);
  const book = useBookAppointment();
  const reschedule = useRescheduleAppointment();

  // Sincroniza o fluxo com o link de entrada (perfil do barbeiro, "agendar de novo", remarcar).
  const paramKey = params.toString();
  useEffect(() => {
    const search = new URLSearchParams(paramKey);
    const serviceIds = search.get("servicos")?.split(",").filter(Boolean) ?? [];
    const professional = search.get("profissional");
    const rescheduleId = search.get("remarcar");
    if (serviceIds.length === 0 && !professional && !rescheduleId) return;
    useBookingStore.getState().start({
      serviceIds,
      professionalId: professional ?? undefined,
      rescheduleId,
      step: rescheduleId || (serviceIds.length > 0 && professional) ? "datetime" : "services",
    });
  }, [paramKey]);

  const steps = BOOKING_STEPS.filter((s) => s.id !== "identify" || !client);
  const index = steps.findIndex((s) => s.id === store.step);
  const go = (offset: number) => {
    const next = steps[index + offset];
    if (next) store.goTo(next.id);
  };

  const confirm = () => {
    if (!store.slot || !client) return;
    const onError = (error: Error) => {
      if (error instanceof SlotTakenError) {
        toast.error("Esse horário acabou de ser ocupado. Escolha outro horário abaixo.");
        store.goTo("datetime");
      } else {
        toast.error("Não foi possível confirmar. Verifique sua conexão e tente de novo.");
      }
    };
    if (store.rescheduleId) {
      reschedule.mutate(
        { id: store.rescheduleId, start: store.slot.start, professionalId: store.slot.professionalId },
        {
          onSuccess: (apt) => {
            store.start({});
            router.push(`/agendar/confirmado?id=${apt.id}&remarcado=1`);
          },
          onError,
        },
      );
      return;
    }
    book.mutate(
      {
        clientId: client.id,
        serviceIds: store.serviceIds,
        professionalId: store.slot.professionalId,
        start: store.slot.start,
        note: store.note,
        origin: "online",
      },
      {
        onSuccess: (apt) => {
          store.start({});
          router.push(`/agendar/confirmado?id=${apt.id}`);
        },
        onError,
      },
    );
  };

  const stepView: Record<BookingStep, React.ReactNode> = {
    services: <ServicesStep clubServiceIds={quote.club.active ? (quote.club.plan?.benefits.map((b) => b.serviceId) ?? []) : []} />,
    professional: <ProfessionalStep onChosen={() => go(1)} />,
    datetime: <DateTimeStep onChosen={() => go(1)} />,
    identify: (
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Quem vai cortar?</h2>
        <PhoneSignIn onSignedIn={() => store.goTo("review")} />
      </div>
    ),
    review: <ReviewStep />,
  };

  const bar = {
    services: {
      label: "Continuar",
      disabled: store.serviceIds.length === 0,
      onClick: () => go(1),
    },
    review: {
      label: store.rescheduleId ? "Confirmar remarcação" : "Confirmar agendamento",
      disabled: !store.slot || !client,
      onClick: confirm,
    },
  } as const;
  const action = store.step === "services" || store.step === "review" ? bar[store.step] : null;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 pt-6 pb-40">
      <div className="flex items-center gap-2">
        {index > 0 && (
          <Button variant="ghost" size="icon" onClick={() => go(-1)} aria-label="Voltar ao passo anterior">
            <ArrowLeft strokeWidth={1.75} aria-hidden />
          </Button>
        )}
        <div className="flex-1">
          <BookingProgress steps={steps} current={store.step} />
        </div>
      </div>
      {stepView[store.step]}
      <BookingSummaryBar
        durationMinutes={quote.totals.durationMinutes}
        payableCents={quote.totals.payableCents}
        count={store.serviceIds.length}
        action={
          action && {
            ...action,
            loading: book.isPending || reschedule.isPending,
          }
        }
      />
    </div>
  );
}
