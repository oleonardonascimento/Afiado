"use client";

/** Folgas e férias de um barbeiro: lista as próximas e permite adicionar ou remover. */
import { X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { FormField } from "@/components/shared/FormField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TimeOff } from "@/domain/entities";
import {
  useCreateTimeOff,
  useRemoveTimeOff,
} from "@/features/agenda/hooks/useAgenda";
import { useTimeOff } from "@/features/catalog/hooks/useCatalog";
import { atTime, todayIn } from "@/lib/calendar";
import { formatDate, formatTime } from "@/lib/format";

const KIND_LABEL: Record<TimeOff["kind"], string> = {
  block: "Bloqueio",
  dayoff: "Folga",
  vacation: "Férias",
};

export function TimeOffList({ professionalId }: { professionalId: string }) {
  const timeOff = useTimeOff();
  const create = useCreateTimeOff();
  const remove = useRemoveTimeOff();
  const today = todayIn(new Date());
  const [kind, setKind] = useState<"dayoff" | "vacation">("dayoff");
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const upcoming = (timeOff.data ?? [])
    .filter(
      (t) =>
        t.professionalId === professionalId && t.end >= atTime(today, "00:00"),
    )
    .sort((a, b) => a.start.localeCompare(b.start));

  const add = () => {
    if (!from || !to || to < from) {
      setError("A data final precisa ser igual ou depois da inicial.");
      return;
    }
    setError(null);
    create.mutate(
      {
        professionalId,
        kind,
        start: atTime(from, "00:00"),
        end: atTime(to, "23:59"),
        reason: reason.trim(),
      },
      {
        onSuccess: () => {
          toast.success(
            kind === "vacation" ? "Férias registradas" : "Folga registrada",
          );
          setReason("");
        },
        onError: () =>
          toast.error("Não foi possível registrar. Tente de novo."),
      },
    );
  };

  return (
    <section aria-labelledby="pro-timeoff" className="flex flex-col gap-3">
      <h2 id="pro-timeoff" className="text-lg font-semibold">
        Folgas e férias
      </h2>
      {upcoming.length === 0 ? (
        <p className="text-text-muted text-sm">
          Nenhuma folga marcada daqui para frente.
        </p>
      ) : (
        <ul className="divide-border rounded-card border-border divide-y border">
          {upcoming.map((t) => (
            <li
              key={t.id}
              className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
            >
              <span className="min-w-0">
                <span className="font-medium">{KIND_LABEL[t.kind]}</span>{" "}
                <span className="tabular-nums">
                  {t.kind === "block"
                    ? `${formatDate(t.start, "dd/MM")} ${formatTime(t.start)}–${formatTime(t.end)}`
                    : `${formatDate(t.start, "dd/MM")} a ${formatDate(t.end, "dd/MM")}`}
                </span>
                {t.reason && (
                  <span className="text-text-muted block truncate">
                    {t.reason}
                  </span>
                )}
              </span>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Remover ${KIND_LABEL[t.kind].toLowerCase()} de ${formatDate(t.start, "dd/MM")}`}
                disabled={remove.isPending}
                onClick={() =>
                  remove.mutate(t.id, {
                    onSuccess: () => toast.success("Removido da agenda"),
                    onError: () =>
                      toast.error("Não foi possível remover. Tente de novo."),
                  })
                }
              >
                <X strokeWidth={1.75} aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
      )}
      <div className="rounded-card border-border grid gap-3 border p-3 sm:grid-cols-2">
        <FormField id="to-kind" label="Tipo">
          <Select
            value={kind}
            onValueChange={(v) => setKind(v as "dayoff" | "vacation")}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dayoff">Folga</SelectItem>
              <SelectItem value="vacation">Férias</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
        <FormField id="to-reason" label="Motivo (opcional)">
          <Input value={reason} onChange={(e) => setReason(e.target.value)} />
        </FormField>
        <FormField id="to-from" label="De" error={error ?? undefined}>
          <Input
            type="date"
            min={today}
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </FormField>
        <FormField id="to-to" label="Até">
          <Input
            type="date"
            min={from}
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </FormField>
        <Button
          type="button"
          variant="secondary"
          className="sm:col-span-2 sm:justify-self-end"
          loading={create.isPending}
          onClick={add}
        >
          Registrar {kind === "vacation" ? "férias" : "folga"}
        </Button>
      </div>
    </section>
  );
}
