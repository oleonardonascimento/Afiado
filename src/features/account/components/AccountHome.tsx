"use client";

/** C8: próximo horário, agendar de novo, status do plano e sair. */
import { LogOut, Repeat } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ErrorState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { remainingLabel } from "@/domain/subscription";
import { useAccountClient } from "@/features/account/components/AccountShell";
import { AppointmentItem } from "@/features/account/components/AppointmentItem";
import { useClientAppointments } from "@/features/account/hooks/useMyAppointments";
import { useSignOut } from "@/features/auth/hooks/useClientAuth";
import { useProfessionals, useReviews, useServices, useShop } from "@/features/catalog/hooks/useCatalog";
import { useClientClub } from "@/features/club/hooks/useClientClub";
import { formatDate } from "@/lib/format";
import { SUBSCRIPTION_STATUS_LABEL, firstName } from "@/lib/labels";

export function AccountHome() {
  const client = useAccountClient();
  const router = useRouter();
  const appointments = useClientAppointments(client.id);
  const services = useServices();
  const professionals = useProfessionals();
  const reviews = useReviews();
  const shop = useShop();
  const club = useClientClub(client.id);
  const signOut = useSignOut();

  const list = appointments.data ?? [];
  const next = list
    .filter((a) => a.status === "scheduled" || a.status === "confirmed")
    .sort((a, b) => a.start.localeCompare(b.start))[0];
  const last = list.filter((a) => a.status === "done").sort((a, b) => b.start.localeCompare(a.start))[0];

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold">Olá, {firstName(client.name)}</h1>

      <section aria-labelledby="next-title" className="flex flex-col gap-3">
        <h2 id="next-title" className="text-lg font-semibold">
          Próximo horário
        </h2>
        {appointments.isLoading || services.isLoading ? (
          <Skeleton className="h-28 rounded-card" />
        ) : appointments.isError ? (
          <ErrorState onRetry={() => void appointments.refetch()} />
        ) : next ? (
          <AppointmentItem
            appointment={next}
            services={services.data ?? []}
            professional={professionals.data?.find((p) => p.id === next.professionalId)}
            deadlineHours={shop.data?.booking.cancelDeadlineHours ?? 3}
            reviewed={false}
          />
        ) : (
          <div className="flex flex-col items-start gap-3 rounded-card border border-border bg-surface p-4">
            <p className="text-text-muted">Você não tem horário marcado.</p>
            <Button asChild variant="primary">
              <Link href="/agendar">Agendar horário</Link>
            </Button>
          </div>
        )}
        {last && !next && (
          <Button asChild variant="secondary" className="self-start">
            <Link href={`/agendar?servicos=${last.serviceIds.join(",")}&profissional=${last.professionalId}`}>
              <Repeat strokeWidth={1.75} aria-hidden />
              Agendar de novo o último atendimento
            </Link>
          </Button>
        )}
        {reviews.data && last && !reviews.data.some((r) => r.appointmentId === last.id) && (
          <p className="text-sm text-text-muted">
            Seu último atendimento ainda não foi avaliado.{" "}
            <Link href="/conta/agendamentos" className="text-text underline underline-offset-4">
              Avaliar agora
            </Link>
          </p>
        )}
      </section>

      <section aria-labelledby="plan-title" className="flex flex-col gap-3">
        <h2 id="plan-title" className="text-lg font-semibold">
          Clube
        </h2>
        {club.isLoading ? (
          <Skeleton className="h-24 rounded-card" />
        ) : club.subscription && club.plan && club.subscription.status !== "canceled" ? (
          <div className="flex flex-col gap-2 rounded-card border border-border bg-surface p-4">
            <p className="font-medium">
              {club.plan.name} · {SUBSCRIPTION_STATUS_LABEL[club.subscription.status]}
            </p>
            {club.usage && (
              <ul className="text-sm text-text-muted">
                {club.plan.benefits.map((b) => (
                  <li key={b.serviceId}>
                    {services.data?.find((s) => s.id === b.serviceId)?.name ?? "Serviço"}:{" "}
                    {remainingLabel(b.monthlyLimit, club.usage?.byService[b.serviceId] ?? 0)}
                  </li>
                ))}
              </ul>
            )}
            <p className="text-sm text-text-muted">
              Período até {formatDate(club.subscription.currentPeriodEnd, "dd/MM/yyyy")}
            </p>
            <Link href="/conta/plano" className="self-start text-sm underline underline-offset-4">
              Ver meu plano
            </Link>
          </div>
        ) : (
          <div className="flex flex-col items-start gap-2 rounded-card border border-border bg-surface p-4">
            <p className="text-text-muted">Com o Clube, você paga um valor fixo por mês e corta quando precisar.</p>
            <Link href="/clube" className="text-sm underline underline-offset-4">
              Conhecer os planos
            </Link>
          </div>
        )}
      </section>

      <Button
        variant="ghost"
        className="self-start"
        loading={signOut.isPending}
        onClick={() =>
          signOut.mutate(undefined, {
            onSuccess: () => {
              toast.success("Você saiu da sua conta");
              router.push("/");
            },
          })
        }
      >
        <LogOut strokeWidth={1.75} aria-hidden />
        Sair da conta
      </Button>
    </div>
  );
}
