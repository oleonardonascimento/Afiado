"use client";

import { CalendarDays, Crown, Scissors, User } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useBookingStore } from "@/features/booking/booking-store";
import { useBookingQuote } from "@/features/booking/hooks/useBookingQuote";
import { useProfessionals, useShop } from "@/features/catalog/hooks/useCatalog";
import { dateOf } from "@/lib/calendar";
import { formatBRL, formatDate, formatTime } from "@/lib/format";
import { capitalizeFirst, durationLabel } from "@/lib/labels";

/** Passo 5: resumo, observação e política de cancelamento em uma linha. */
export function ReviewStep() {
  const { serviceIds, slot, note, setNote, rescheduleId } = useBookingStore();
  const quote = useBookingQuote(serviceIds, slot ? dateOf(slot.start) : null);
  const professionals = useProfessionals();
  const shop = useShop();
  const pro = professionals.data?.find((p) => p.id === slot?.professionalId);
  const deadline = shop.data?.booking.cancelDeadlineHours ?? 3;

  if (!slot) return null;
  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-xl font-semibold">
        {rescheduleId ? "Confira o novo horário" : "Confira e confirme"}
      </h2>
      <dl className="divide-border rounded-card border-border bg-surface flex flex-col divide-y border">
        <Row icon={CalendarDays} label="Quando">
          {capitalizeFirst(formatDate(slot.start, "EEEE, dd/MM"))} às{" "}
          <span className="tabular-nums">{formatTime(slot.start)}</span>
        </Row>
        <Row icon={User} label="Com">
          {pro?.name ?? "Barbeiro disponível"}
        </Row>
        <Row icon={Scissors} label="Serviços">
          <ul className="flex flex-col gap-1">
            {quote.chosen.map((s) => (
              <li key={s.id} className="flex justify-between gap-4">
                <span>{s.name}</span>
                {quote.coveredIds.includes(s.id) ? (
                  <span className="text-club-fg inline-flex items-center gap-1">
                    <Crown
                      className="size-3.5"
                      strokeWidth={1.75}
                      aria-hidden
                    />
                    Clube
                  </span>
                ) : (
                  <span className="tabular-nums">
                    {formatBRL(s.priceCents)}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </Row>
        <div className="flex items-baseline justify-between px-4 py-3">
          <span className="text-text-muted">
            Total ·{" "}
            <span className="tabular-nums">
              {durationLabel(quote.totals.durationMinutes)}
            </span>
          </span>
          <span className="text-lg font-semibold tabular-nums">
            {formatBRL(quote.totals.payableCents)}
          </span>
        </div>
      </dl>
      {quote.totals.coveredCents > 0 && (
        <p className="text-club-fg text-sm">
          Você economiza {formatBRL(quote.totals.coveredCents)} com o Clube
          neste horário.
        </p>
      )}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="note">Observação para o barbeiro (opcional)</Label>
        <Textarea
          id="note"
          value={note}
          maxLength={280}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ex.: manter o comprimento em cima"
        />
      </div>
      <p className="text-text-muted text-sm">
        Pagamento na barbearia. Dá para remarcar ou cancelar até {deadline}h
        antes, pelo site.
      </p>
    </div>
  );
}

function Row({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof CalendarDays;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3 px-4 py-3">
      <Icon
        className="text-text-muted mt-0.5 size-5 shrink-0"
        strokeWidth={1.75}
        aria-hidden
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <dt className="text-text-muted text-sm">{label}</dt>
        <dd>{children}</dd>
      </div>
    </div>
  );
}
