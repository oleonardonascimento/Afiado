"use client";

/** Aba "Horários": grade semanal da barbearia + dias fechados (feriados, reformas). */
import { X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { FormField } from "@/components/shared/FormField";
import { WeeklyHoursEditor } from "@/components/shared/WeeklyHoursEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Barbershop } from "@/domain/entities";
import { weeklyHoursProblem } from "@/domain/shop";
import { useUpdateShop } from "@/features/settings/hooks/useCatalogAdmin";
import { middayIso, todayIn } from "@/lib/calendar";
import { formatDate } from "@/lib/format";

export function ShopHoursForm({ shop }: { shop: Barbershop }) {
  const update = useUpdateShop();
  const [hours, setHours] = useState(shop.hours);
  const [hoursError, setHoursError] = useState<string | null>(null);
  const today = todayIn(new Date());
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");
  const [closureError, setClosureError] = useState<string | null>(null);

  const saveHours = () => {
    const problem = weeklyHoursProblem(hours);
    setHoursError(problem);
    if (problem) return;
    update.mutate(
      { hours },
      {
        onSuccess: () => toast.success("Horário de funcionamento salvo"),
        onError: () => toast.error("Não foi possível salvar. Tente de novo."),
      },
    );
  };

  const saveClosures = (closures: Barbershop["closures"], message: string) =>
    update.mutate(
      { closures: [...closures].sort((a, b) => a.date.localeCompare(b.date)) },
      {
        onSuccess: () => toast.success(message),
        onError: () => toast.error("Não foi possível salvar. Tente de novo."),
      },
    );

  const addClosure = () => {
    if (!date) return setClosureError("Escolha a data.");
    if (shop.closures.some((c) => c.date === date))
      return setClosureError("Essa data já está fechada.");
    setClosureError(null);
    saveClosures(
      [...shop.closures, { date, reason: reason.trim() }],
      "Dia fechado adicionado",
    );
    setDate("");
    setReason("");
  };

  const upcoming = shop.closures.filter((c) => c.date >= today);

  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby="hours-week" className="flex flex-col gap-3">
        <h2 id="hours-week" className="text-lg font-semibold">
          Horário de funcionamento
        </h2>
        <WeeklyHoursEditor value={hours} onChange={setHours} />
        {hoursError && (
          <p role="alert" className="text-danger text-sm">
            {hoursError}
          </p>
        )}
        <Button
          className="self-end"
          loading={update.isPending}
          onClick={saveHours}
        >
          Salvar horário
        </Button>
      </section>

      <section aria-labelledby="hours-closures" className="flex flex-col gap-3">
        <h2 id="hours-closures" className="text-lg font-semibold">
          Dias fechados
        </h2>
        <p className="text-text-muted text-sm">
          Nesses dias ninguém consegue agendar, nem pelo site nem pelo painel.
        </p>
        {upcoming.length === 0 ? (
          <p className="text-text-muted text-sm">
            Nenhum dia fechado daqui para frente.
          </p>
        ) : (
          <ul className="divide-border rounded-card border-border divide-y border text-sm">
            {upcoming.map((c) => (
              <li
                key={c.date}
                className="flex items-center justify-between gap-3 px-3 py-1"
              >
                <span>
                  <span className="tabular-nums">
                    {formatDate(middayIso(c.date), "dd/MM/yyyy")}
                  </span>
                  {c.reason && (
                    <span className="text-text-muted"> · {c.reason}</span>
                  )}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Reabrir ${formatDate(middayIso(c.date), "dd/MM")}`}
                  onClick={() =>
                    saveClosures(
                      shop.closures.filter((x) => x.date !== c.date),
                      "Dia reaberto para agendamento",
                    )
                  }
                >
                  <X strokeWidth={1.75} aria-hidden />
                </Button>
              </li>
            ))}
          </ul>
        )}
        <div className="grid gap-3 sm:grid-cols-3 sm:items-end">
          <FormField
            id="closure-date"
            label="Data"
            error={closureError ?? undefined}
          >
            <Input
              type="date"
              min={today}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </FormField>
          <FormField id="closure-reason" label="Motivo (opcional)">
            <Input
              placeholder="Ex.: feriado"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </FormField>
          <Button
            variant="secondary"
            onClick={addClosure}
            disabled={update.isPending}
          >
            Fechar este dia
          </Button>
        </div>
      </section>
    </div>
  );
}
