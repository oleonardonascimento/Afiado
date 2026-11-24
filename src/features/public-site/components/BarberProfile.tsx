"use client";

/** C4: perfil do barbeiro — bio, especialidades, nota, avaliações e próximos horários livres. */
import Link from "next/link";
import { PersonAvatar } from "@/components/shared/PersonAvatar";
import { Stars } from "@/components/shared/Stars";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ratingSummary } from "@/domain/shop";
import { useBookingAvailability } from "@/features/booking/hooks/useBookingAvailability";
import { useProfessionals, useReviews, useServices } from "@/features/catalog/hooks/useCatalog";
import { middayIso } from "@/lib/calendar";
import { formatBRL, formatDate, formatTime } from "@/lib/format";
import { capitalizeFirst, durationLabel } from "@/lib/labels";

const MAX_REVIEWS = 5;
const MAX_SLOTS = 6;
const MAX_DAYS = 2;

export function BarberProfile({ id }: { id: string }) {
  const professionals = useProfessionals();
  const services = useServices();
  const reviews = useReviews();
  const pro = professionals.data?.find((p) => p.id === id && p.active && p.serviceIds.length > 0);
  const mainService = pro?.serviceIds[0];
  const availability = useBookingAvailability({
    serviceIds: mainService ? [mainService] : [],
    professionalId: pro?.id ?? null,
  });

  if (professionals.isLoading) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-8">
        <Skeleton className="size-20 rounded-full" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 rounded-card" />
      </div>
    );
  }
  if (professionals.isError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <ErrorState onRetry={() => void professionals.refetch()} />
      </div>
    );
  }
  if (!pro) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <EmptyState title="Profissional não encontrado" description="Esse perfil não existe ou não atende mais por aqui.">
          <Button asChild variant="secondary">
            <Link href="/#equipe">Ver a equipe</Link>
          </Button>
        </EmptyState>
      </div>
    );
  }

  const rating = ratingSummary(reviews.data ?? [], pro.id);
  const proReviews = (reviews.data ?? [])
    .filter((r) => r.professionalId === pro.id && r.comment)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, MAX_REVIEWS);
  const proServices = (services.data ?? []).filter((s) => pro.serviceIds.includes(s.id) && s.active);
  const nextDays = availability.days.filter((d) => d.slots.length > 0).slice(0, MAX_DAYS);
  const mainServiceName = proServices.find((s) => s.id === mainService)?.name;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-8 pb-28 md:pb-8">
      <header className="flex items-center gap-4">
        <PersonAvatar name={pro.name} photoUrl={pro.photoUrl} size="lg" />
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-4xl uppercase">{pro.name}</h1>
          <p className="text-text-muted">{pro.specialties.join(", ")}</p>
          {rating.average !== null && (
            <p className="flex items-center gap-2 text-sm tabular-nums">
              <Stars value={rating.average} />
              {rating.average.toFixed(1).replace(".", ",")} ({rating.count}{" "}
              {rating.count === 1 ? "avaliação" : "avaliações"})
            </p>
          )}
        </div>
      </header>

      {pro.bio && <p className="max-w-prose">{pro.bio}</p>}

      <section aria-labelledby="slots-title" className="flex flex-col gap-3">
        <h2 id="slots-title" className="text-lg font-semibold">
          Próximos horários livres
        </h2>
        {mainServiceName && <p className="text-sm text-text-muted">Para {mainServiceName.toLowerCase()}.</p>}
        {availability.isLoading ? (
          <Skeleton className="h-12 rounded-card" />
        ) : availability.isError ? (
          <ErrorState onRetry={availability.refetch} />
        ) : nextDays.length === 0 ? (
          <p className="text-text-muted">Sem horários livres nos próximos 14 dias.</p>
        ) : (
          <dl className="flex flex-col gap-2">
            {nextDays.map((day) => (
              <div key={day.date} className="flex flex-wrap gap-x-2">
                <dt className="font-medium">{capitalizeFirst(formatDate(middayIso(day.date), "EEEE, dd/MM"))}:</dt>
                <dd className="text-text-muted tabular-nums">
                  {day.slots
                    .slice(0, MAX_SLOTS)
                    .map((slot) => formatTime(slot.start))
                    .join(", ")}
                </dd>
              </div>
            ))}
          </dl>
        )}
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface p-4 md:static md:border-0 md:bg-transparent md:p-0">
          <Button asChild variant="brand" size="lg" className="w-full md:w-auto">
            <Link href={`/agendar?profissional=${pro.id}`}>Agendar com {pro.name}</Link>
          </Button>
        </div>
      </section>

      <section aria-labelledby="services-title" className="flex flex-col gap-3">
        <h2 id="services-title" className="text-lg font-semibold">
          Serviços
        </h2>
        <ul className="divide-y divide-border rounded-card border border-border bg-surface">
          {proServices.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <span>
                {s.name}
                <span className="block text-sm text-text-muted">{durationLabel(s.durationMinutes)}</span>
              </span>
              <span className="tabular-nums">{formatBRL(s.priceCents)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="reviews-title" className="flex flex-col gap-3">
        <h2 id="reviews-title" className="text-lg font-semibold">
          Avaliações
        </h2>
        <p className="text-sm text-text-muted">Avaliações de exemplo, geradas para demonstração.</p>
        {proReviews.length === 0 ? (
          <p className="text-text-muted">Ainda sem avaliações com comentário.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {proReviews.map((r) => (
              <li key={r.id} className="flex flex-col gap-1 border-b border-border pb-3 last:border-0">
                <span className="flex items-center gap-2 text-sm text-text-muted">
                  <Stars value={r.rating} />
                  {formatDate(r.createdAt, "dd/MM/yyyy")}
                </span>
                <p>{r.comment}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
