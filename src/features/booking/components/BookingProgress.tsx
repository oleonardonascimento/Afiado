"use client";

/**
 * Barra de progresso do agendamento — o único uso da listra do poste nesta tela.
 * A listra "gira" ao avançar de passo (momento orquestrado do PRD §8.3).
 */
import { PoleStripe } from "@/components/shared/PoleStripe";
import type { BookingStep } from "@/features/booking/booking-store";

type BookingProgressProps = {
  steps: { id: BookingStep; label: string }[];
  current: BookingStep;
};

export function BookingProgress({ steps, current }: BookingProgressProps) {
  const index = Math.max(
    0,
    steps.findIndex((s) => s.id === current),
  );
  const label = steps[index]?.label ?? "";
  const pct = ((index + 1) / steps.length) * 100;
  return (
    <div className="flex flex-col gap-2">
      <p className="text-text-muted text-sm">
        Passo {index + 1} de {steps.length} ·{" "}
        <span className="text-text font-medium">{label}</span>
      </p>
      <div
        className="bg-surface-2 h-2 overflow-hidden rounded-full"
        role="progressbar"
        aria-label="Progresso do agendamento"
        aria-valuemin={1}
        aria-valuemax={steps.length}
        aria-valuenow={index + 1}
        aria-valuetext={`Passo ${index + 1} de ${steps.length}: ${label}`}
      >
        <div
          className="h-full transition-[width] duration-200 ease-out"
          style={{ width: `${pct}%` }}
        >
          <PoleStripe key={current} animated className="h-full" />
        </div>
      </div>
    </div>
  );
}
