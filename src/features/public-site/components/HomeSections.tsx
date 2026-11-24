"use client";

/** Seções da home (C1): serviços, equipe, Clube, avaliações. */
import { ChevronRight, Crown } from "lucide-react";
import Link from "next/link";
import { PersonAvatar } from "@/components/shared/PersonAvatar";
import { ErrorState } from "@/components/shared/states";
import { Stars } from "@/components/shared/Stars";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ratingSummary } from "@/domain/shop";
import {
  usePlans,
  useProfessionals,
  useReviews,
  useServices,
} from "@/features/catalog/hooks/useCatalog";
import { formatBRL, formatDate } from "@/lib/format";
import { durationLabel, firstName } from "@/lib/labels";

function SectionTitle({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  return (
    <h2
      id={id}
      className="font-display leading-display tracking-display text-3xl font-black uppercase md:text-4xl"
    >
      {children}
    </h2>
  );
}

function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="rounded-card h-14" />
      ))}
    </div>
  );
}

export function HomeServices() {
  const services = useServices();
  const plans = usePlans();
  const inClub = new Set(
    plans.data?.flatMap((p) => p.benefits.map((b) => b.serviceId)) ?? [],
  );
  const list =
    services.data?.filter((s) => s.active && s.onlineBooking).slice(0, 6) ?? [];

  return (
    <section aria-labelledby="servicos" className="flex flex-col gap-4">
      <SectionTitle id="servicos">Serviços</SectionTitle>
      {services.isLoading ? (
        <ListSkeleton />
      ) : services.isError ? (
        <ErrorState onRetry={() => void services.refetch()} />
      ) : (
        <ul className="divide-border border-border divide-y border-y">
          {list.map((s) => (
            <li key={s.id}>
              <Link
                href={`/agendar?servicos=${s.id}`}
                className="hover:bg-surface-2 flex min-h-14 items-center gap-3 py-3"
              >
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="font-medium">{s.name}</span>
                  <span className="text-text-muted text-sm tabular-nums">
                    {durationLabel(s.durationMinutes)}
                    {inClub.has(s.id) && (
                      <span className="text-club-fg ml-2 inline-flex items-center gap-1">
                        <Crown
                          className="size-3.5"
                          strokeWidth={1.75}
                          aria-hidden
                        />
                        incluso no Clube
                      </span>
                    )}
                  </span>
                </span>
                <span className="font-medium tabular-nums">
                  {formatBRL(s.priceCents)}
                </span>
                <ChevronRight
                  className="text-text-muted size-4"
                  strokeWidth={1.75}
                  aria-hidden
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Link
        href="/agendar"
        className="text-primary self-start underline underline-offset-4"
      >
        Ver todos os serviços
      </Link>
    </section>
  );
}

export function HomeTeam() {
  const professionals = useProfessionals();
  const reviews = useReviews();
  const team =
    professionals.data?.filter((p) => p.active && p.serviceIds.length > 0) ??
    [];
  return (
    <section aria-labelledby="equipe" className="flex flex-col gap-4">
      <SectionTitle id="equipe">Equipe</SectionTitle>
      {professionals.isLoading ? (
        <ListSkeleton rows={2} />
      ) : professionals.isError ? (
        <ErrorState onRetry={() => void professionals.refetch()} />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {team.map((pro) => {
            const rating = ratingSummary(reviews.data ?? [], pro.id);
            return (
              <li key={pro.id}>
                <Link
                  href={`/barbeiros/${pro.id}`}
                  className="rounded-card border-border bg-surface hover:bg-surface-2 flex items-center gap-3 border p-3"
                >
                  <PersonAvatar name={pro.name} photoUrl={pro.photoUrl} />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="font-medium">{pro.name}</span>
                    <span className="text-text-muted truncate text-sm">
                      {pro.specialties.join(", ")}
                    </span>
                    {rating.average !== null && (
                      <span className="text-text-muted flex items-center gap-1 text-sm tabular-nums">
                        <Stars value={rating.average} />{" "}
                        {rating.average.toFixed(1).replace(".", ",")}
                      </span>
                    )}
                  </span>
                  <ChevronRight
                    className="text-text-muted size-4"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export function HomeClub() {
  const plans = usePlans();
  const cheapest = plans.data
    ?.filter((p) => p.active)
    .sort((a, b) => a.priceCents - b.priceCents)[0];
  return (
    <section
      aria-labelledby="clube"
      className="rounded-card bg-club text-club-fg flex flex-col gap-4 p-6"
    >
      <div className="flex items-center gap-2">
        <Crown className="size-6" strokeWidth={1.75} aria-hidden />
        <SectionTitle id="clube">Clube Afiado</SectionTitle>
      </div>
      {cheapest ? (
        <p className="text-lg">
          A partir de{" "}
          <strong className="tabular-nums">
            {formatBRL(cheapest.priceCents)}/mês
          </strong>
          .
        </p>
      ) : (
        <Skeleton className="h-7 w-48" />
      )}
      <ul className="flex list-disc flex-col gap-1 pl-5">
        <li>Corte sem pagar na hora, toda semana.</li>
        <li>Você vê quanto já usou do plano no mês.</li>
        <li>Cancela em 1 clique, sem multa e sem ligação.</li>
      </ul>
      <Button asChild variant="primary" className="self-start">
        <Link href="/clube">Conhecer planos</Link>
      </Button>
    </section>
  );
}

export function HomeReviews() {
  const reviews = useReviews();
  const professionals = useProfessionals();
  const recent = [...(reviews.data ?? [])]
    .filter((r) => r.rating >= 4 && r.comment)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 3);
  return (
    <section aria-labelledby="avaliacoes" className="flex flex-col gap-4">
      <SectionTitle id="avaliacoes">Avaliações</SectionTitle>
      <p className="text-text-muted text-sm">Exemplos de demonstração.</p>
      {reviews.isLoading ? (
        <ListSkeleton rows={3} />
      ) : (
        <ul className="grid gap-3 md:grid-cols-3">
          {recent.map((r) => (
            <li
              key={r.id}
              className="border-border-strong flex flex-col gap-2 border-l-2 pl-4"
            >
              <Stars value={r.rating} />
              <p>&ldquo;{r.comment}&rdquo;</p>
              <p className="text-text-muted text-sm">
                Atendimento com{" "}
                {firstName(
                  professionals.data?.find((p) => p.id === r.professionalId)
                    ?.name ?? "a equipe",
                )}{" "}
                · {formatDate(r.createdAt, "dd/MM")}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
