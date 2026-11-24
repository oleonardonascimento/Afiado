"use client";

import { Button } from "@/components/ui/button";
import { formatBRL } from "@/lib/format";
import { durationLabel } from "@/lib/labels";

type BookingSummaryBarProps = {
  count: number;
  durationMinutes: number;
  payableCents: number;
  action: {
    label: string;
    disabled: boolean;
    loading: boolean;
    onClick: () => void;
  } | null;
};

/** Resumo fixo no rodapé: total de tempo e valor + ação do passo. */
export function BookingSummaryBar({
  count,
  durationMinutes,
  payableCents,
  action,
}: BookingSummaryBarProps) {
  return (
    <div className="border-border bg-surface fixed inset-x-0 bottom-0 z-30 border-t">
      <div className="mx-auto flex max-w-2xl items-center gap-4 px-4 py-3">
        <div className="flex min-w-0 flex-1 flex-col" aria-live="polite">
          {count === 0 ? (
            <span className="text-text-muted text-sm">
              Escolha pelo menos um serviço
            </span>
          ) : (
            <>
              <span className="text-text-muted text-sm">
                {count} {count === 1 ? "serviço" : "serviços"} ·{" "}
                <span className="tabular-nums">
                  {durationLabel(durationMinutes)}
                </span>
              </span>
              <span className="text-lg font-semibold tabular-nums">
                {formatBRL(payableCents)}
              </span>
            </>
          )}
        </div>
        {action && (
          <Button
            variant="brand"
            size="lg"
            disabled={action.disabled}
            loading={action.loading}
            onClick={action.onClick}
          >
            {action.label}
          </Button>
        )}
      </div>
    </div>
  );
}
