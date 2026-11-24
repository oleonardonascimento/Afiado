"use client";

/**
 * Grade semanal de horários (barbearia e barbeiro).
 * Quando usar: qualquer formulário que edite `WeeklyHours[]`. Controlado (value/onChange).
 * Cada dia pode ter várias faixas (ex.: manhã e tarde com pausa). Dia sem faixa = fechado / folga.
 * Teclado: checkbox do dia com Espaço; campos de hora nativos; botões com Enter/Espaço.
 */
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import type { TimeRange, WeeklyHours } from "@/domain/entities";
import { WEEKDAY_NAMES } from "@/domain/shop";
import { capitalizeFirst } from "@/lib/labels";

/** Segunda primeiro, domingo por último — como o barbeiro pensa a semana. */
const ORDER = [1, 2, 3, 4, 5, 6, 0];
const DEFAULT_RANGE: TimeRange = { start: "09:00", end: "19:00" };

type WeeklyHoursEditorProps = {
  value: WeeklyHours[];
  onChange: (value: WeeklyHours[]) => void;
  closedLabel?: string;
};

export function WeeklyHoursEditor({
  value,
  onChange,
  closedLabel = "Fechado",
}: WeeklyHoursEditorProps) {
  const rangesOf = (weekday: number) =>
    value.find((h) => h.weekday === weekday)?.ranges ?? [];
  const setRanges = (weekday: number, ranges: TimeRange[]) =>
    onChange(
      ORDER.map((d) => ({
        weekday: d,
        ranges: d === weekday ? ranges : rangesOf(d),
      })).filter((h) => h.ranges.length > 0),
    );

  return (
    <ul className="divide-border rounded-card border-border flex flex-col divide-y border">
      {ORDER.map((weekday) => {
        const ranges = rangesOf(weekday);
        const name = capitalizeFirst(WEEKDAY_NAMES[weekday] ?? "");
        return (
          <li
            key={weekday}
            className="flex flex-col gap-2 p-3 sm:flex-row sm:items-start"
          >
            <label className="flex min-h-11 w-32 shrink-0 items-center gap-3 text-sm font-medium">
              <Checkbox
                checked={ranges.length > 0}
                onCheckedChange={(v) =>
                  setRanges(weekday, v ? [DEFAULT_RANGE] : [])
                }
              />
              {name}
            </label>
            {ranges.length === 0 ? (
              <p className="text-text-muted flex min-h-11 items-center text-sm">
                {closedLabel}
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {ranges.map((r, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      type="time"
                      aria-label={`${name}, faixa ${i + 1}, início`}
                      className="w-32 tabular-nums"
                      value={r.start}
                      onChange={(e) =>
                        setRanges(
                          weekday,
                          ranges.map((x, j) =>
                            j === i ? { ...x, start: e.target.value } : x,
                          ),
                        )
                      }
                    />
                    <span className="text-text-muted">até</span>
                    <Input
                      type="time"
                      aria-label={`${name}, faixa ${i + 1}, fim`}
                      className="w-32 tabular-nums"
                      value={r.end}
                      onChange={(e) =>
                        setRanges(
                          weekday,
                          ranges.map((x, j) =>
                            j === i ? { ...x, end: e.target.value } : x,
                          ),
                        )
                      }
                    />
                    {ranges.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Remover faixa ${i + 1} de ${name}`}
                        onClick={() =>
                          setRanges(
                            weekday,
                            ranges.filter((_, j) => j !== i),
                          )
                        }
                      >
                        <X strokeWidth={1.75} aria-hidden />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="self-start"
                  onClick={() => {
                    const last = ranges[ranges.length - 1]?.end ?? "13:00";
                    setRanges(weekday, [
                      ...ranges,
                      { start: last, end: last < "19:00" ? "19:00" : "23:00" },
                    ]);
                  }}
                >
                  <Plus strokeWidth={1.75} aria-hidden />
                  Adicionar faixa
                </Button>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
