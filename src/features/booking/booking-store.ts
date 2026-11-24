"use client";

/** Estado de UI do fluxo de agendamento (passo atual e escolhas). */
import { create } from "zustand";

export type BookingStep =
  "services" | "professional" | "datetime" | "identify" | "review";

export const BOOKING_STEPS: { id: BookingStep; label: string }[] = [
  { id: "services", label: "Serviços" },
  { id: "professional", label: "Profissional" },
  { id: "datetime", label: "Data e horário" },
  { id: "identify", label: "Identificação" },
  { id: "review", label: "Revisão" },
];

type BookingState = {
  step: BookingStep;
  serviceIds: string[];
  /** null = qualquer disponível; undefined = ainda não escolheu */
  professionalId: string | null | undefined;
  date: string | null;
  slot: { start: string; professionalId: string } | null;
  note: string;
  rescheduleId: string | null;
  goTo: (step: BookingStep) => void;
  toggleService: (id: string) => void;
  chooseProfessional: (id: string | null) => void;
  chooseDate: (date: string) => void;
  chooseSlot: (slot: { start: string; professionalId: string }) => void;
  setNote: (note: string) => void;
  start: (
    init: Partial<
      Pick<
        BookingState,
        "serviceIds" | "professionalId" | "rescheduleId" | "step"
      >
    >,
  ) => void;
};

const initial = {
  step: "services" as BookingStep,
  serviceIds: [] as string[],
  professionalId: undefined,
  date: null,
  slot: null,
  note: "",
  rescheduleId: null,
};

export const useBookingStore = create<BookingState>((set) => ({
  ...initial,
  goTo: (step) => set({ step }),
  toggleService: (id) =>
    set((s) => ({
      serviceIds: s.serviceIds.includes(id)
        ? s.serviceIds.filter((x) => x !== id)
        : [...s.serviceIds, id],
      slot: null,
    })),
  chooseProfessional: (professionalId) =>
    set({ professionalId, slot: null, date: null }),
  chooseDate: (date) => set({ date, slot: null }),
  chooseSlot: (slot) => set({ slot }),
  setNote: (note) => set({ note }),
  start: (init) => set({ ...initial, ...init }),
}));
