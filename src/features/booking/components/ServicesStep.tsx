"use client";

import { Check, Crown } from "lucide-react";
import { ErrorState } from "@/components/shared/states";
import { Skeleton } from "@/components/ui/skeleton";
import type { Service, ServiceCategory } from "@/domain/entities";
import { useBookingStore } from "@/features/booking/booking-store";
import { useServices } from "@/features/catalog/hooks/useCatalog";
import { cn } from "@/lib/cn";
import { formatBRL } from "@/lib/format";
import { SERVICE_CATEGORY_LABEL, durationLabel } from "@/lib/labels";

const ORDER: ServiceCategory[] = [
  "corte",
  "combo",
  "barba",
  "tratamento",
  "outros",
];

type ServicesStepProps = { clubServiceIds: string[] };

/** Passo 1: seleção múltipla de serviços, por categoria. */
export function ServicesStep({ clubServiceIds }: ServicesStepProps) {
  const services = useServices();
  const selected = useBookingStore((s) => s.serviceIds);
  const toggle = useBookingStore((s) => s.toggleService);

  if (services.isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <Skeleton key={n} className="rounded-card h-16" />
        ))}
      </div>
    );
  }
  if (services.isError || !services.data) {
    return <ErrorState onRetry={() => void services.refetch()} />;
  }

  const bookable = services.data.filter((s) => s.active && s.onlineBooking);
  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-semibold">Quais serviços você quer?</h2>
      {ORDER.map((category) => {
        const list = bookable.filter((s) => s.category === category);
        if (list.length === 0) return null;
        return (
          <section
            key={category}
            aria-labelledby={`cat-${category}`}
            className="flex flex-col gap-2"
          >
            <h3
              id={`cat-${category}`}
              className="text-text-muted text-sm font-medium"
            >
              {SERVICE_CATEGORY_LABEL[category]}
            </h3>
            <ul className="flex flex-col gap-2">
              {list.map((service) => (
                <li key={service.id}>
                  <ServiceOption
                    service={service}
                    checked={selected.includes(service.id)}
                    inClub={clubServiceIds.includes(service.id)}
                    onToggle={() => toggle(service.id)}
                  />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function ServiceOption({
  service,
  checked,
  inClub,
  onToggle,
}: {
  service: Service;
  checked: boolean;
  inClub: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onToggle}
      className={cn(
        "rounded-card bg-surface flex w-full items-center gap-3 border p-3 text-left transition-colors duration-150",
        checked
          ? "border-primary ring-primary ring-1"
          : "border-border-strong hover:bg-surface-2",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "rounded-control flex size-5 shrink-0 items-center justify-center border",
          checked
            ? "border-primary bg-primary text-primary-fg"
            : "border-border-strong",
        )}
      >
        {checked && <Check className="size-4" strokeWidth={2} />}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="font-medium">{service.name}</span>
        <span className="text-text-muted text-sm tabular-nums">
          {durationLabel(service.durationMinutes)}
        </span>
      </span>
      <span className="flex flex-col items-end">
        {inClub ? (
          <>
            <span className="text-text-muted text-sm tabular-nums line-through">
              {formatBRL(service.priceCents)}
            </span>
            <span className="text-club-fg inline-flex items-center gap-1 text-sm font-medium">
              <Crown className="size-3.5" strokeWidth={1.75} aria-hidden />
              R$ 0 pelo Clube
            </span>
          </>
        ) : (
          <span className="font-medium tabular-nums">
            {formatBRL(service.priceCents)}
          </span>
        )}
      </span>
    </button>
  );
}
