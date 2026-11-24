"use client";

import { Users } from "lucide-react";
import { PersonAvatar } from "@/components/shared/PersonAvatar";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { Stars } from "@/components/shared/Stars";
import { Skeleton } from "@/components/ui/skeleton";
import { professionalsFor } from "@/domain/availability";
import { ratingSummary } from "@/domain/shop";
import { useBookingStore } from "@/features/booking/booking-store";
import {
  useProfessionals,
  useReviews,
} from "@/features/catalog/hooks/useCatalog";
import { cn } from "@/lib/cn";

type ProfessionalStepProps = { onChosen: () => void };

/** Passo 2: "Qualquer disponível" primeiro + barbeiros que fazem todos os serviços. */
export function ProfessionalStep({ onChosen }: ProfessionalStepProps) {
  const professionals = useProfessionals();
  const reviews = useReviews();
  const serviceIds = useBookingStore((s) => s.serviceIds);
  const current = useBookingStore((s) => s.professionalId);
  const choose = useBookingStore((s) => s.chooseProfessional);

  if (professionals.isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {[1, 2, 3].map((n) => (
          <Skeleton key={n} className="rounded-card h-20" />
        ))}
      </div>
    );
  }
  if (professionals.isError || !professionals.data) {
    return <ErrorState onRetry={() => void professionals.refetch()} />;
  }

  const able = professionalsFor(serviceIds, professionals.data);
  const pick = (id: string | null) => {
    choose(id);
    onChosen();
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold">Com quem você quer cortar?</h2>
      {able.length === 0 ? (
        <EmptyState
          title="Nenhum barbeiro faz todos esses serviços juntos"
          description="Volte e tire um dos serviços, ou agende em dois horários."
        />
      ) : (
        <ul className="flex flex-col gap-2">
          <li>
            <Option selected={current === null} onClick={() => pick(null)}>
              <span className="bg-surface-2 flex size-12 items-center justify-center rounded-full">
                <Users className="size-5" strokeWidth={1.75} aria-hidden />
              </span>
              <span className="flex flex-col">
                <span className="font-medium">Qualquer disponível</span>
                <span className="text-text-muted text-sm">
                  Mostra mais horários
                </span>
              </span>
            </Option>
          </li>
          {able.map((pro) => {
            const rating = ratingSummary(reviews.data ?? [], pro.id);
            return (
              <li key={pro.id}>
                <Option
                  selected={current === pro.id}
                  onClick={() => pick(pro.id)}
                >
                  <PersonAvatar name={pro.name} photoUrl={pro.photoUrl} />
                  <span className="flex min-w-0 flex-col">
                    <span className="font-medium">{pro.name}</span>
                    <span className="text-text-muted truncate text-sm">
                      {pro.specialties.join(", ") || "Corte e barba"}
                    </span>
                    {rating.average !== null && (
                      <span className="text-text-muted mt-0.5 flex items-center gap-1.5 text-sm">
                        <Stars value={rating.average} />
                        <span className="tabular-nums">
                          {rating.average.toFixed(1).replace(".", ",")} (
                          {rating.count})
                        </span>
                      </span>
                    )}
                  </span>
                </Option>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Option({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "rounded-card bg-surface flex w-full items-center gap-3 border p-3 text-left transition-colors duration-150",
        selected
          ? "border-primary ring-primary ring-1"
          : "border-border-strong hover:bg-surface-2",
      )}
    >
      {children}
    </button>
  );
}
