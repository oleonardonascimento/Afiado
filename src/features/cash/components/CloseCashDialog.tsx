"use client";

/** Fechar caixa: valores contados × esperados por forma, diferença destacada e observação. */
import { useState } from "react";
import { toast } from "sonner";
import { MoneyInput } from "@/components/shared/MoneyInput";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cashDifference, emptyByMethod, type ByMethod } from "@/domain/cash";
import { PAYMENT_METHODS, type CashSession } from "@/domain/entities";
import { useCloseCash } from "@/features/cash/hooks/useCash";
import { cn } from "@/lib/cn";
import { formatBRL } from "@/lib/format";
import { PAYMENT_METHOD_LABEL } from "@/lib/labels";

type CloseCashDialogProps = {
  session: CashSession;
  expected: ByMethod;
  onClose: () => void;
};

export function CloseCashDialog({
  session,
  expected,
  onClose,
}: CloseCashDialogProps) {
  const close = useCloseCash();
  const [counted, setCounted] = useState<Record<string, number | null>>({});
  const [note, setNote] = useState("");
  const complete = PAYMENT_METHODS.every(
    (m) => counted[m] !== undefined && counted[m] !== null,
  );
  const countedFull: ByMethod = { ...emptyByMethod() };
  for (const m of PAYMENT_METHODS) countedFull[m] = counted[m] ?? 0;
  const diff = cashDifference(expected, countedFull);
  const needsNote = complete && diff.totalCents !== 0 && !note.trim();

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-dvh overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Fechar caixa</DialogTitle>
          <DialogDescription>
            Conte o que tem em cada forma e informe abaixo. A diferença aparece
            na hora.
          </DialogDescription>
        </DialogHeader>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-text-muted text-left">
              <th className="pb-2 font-normal">Forma</th>
              <th className="pb-2 text-right font-normal">Esperado</th>
              <th className="pb-2 pl-3 font-normal">Contado</th>
              <th className="pb-2 text-right font-normal">Diferença</th>
            </tr>
          </thead>
          <tbody>
            {PAYMENT_METHODS.map((m) => {
              const d =
                counted[m] === undefined || counted[m] === null
                  ? null
                  : diff.byMethod[m];
              return (
                <tr key={m} className="border-border border-t">
                  <th scope="row" className="py-2 text-left font-normal">
                    {PAYMENT_METHOD_LABEL[m]}
                  </th>
                  <td className="py-2 text-right tabular-nums">
                    {formatBRL(expected[m])}
                  </td>
                  <td className="py-2 pl-3">
                    <MoneyInput
                      aria-label={`Contado em ${PAYMENT_METHOD_LABEL[m]}`}
                      className="w-32"
                      value={counted[m] ?? null}
                      onChange={(c) =>
                        setCounted((prev) => ({ ...prev, [m]: c }))
                      }
                    />
                  </td>
                  <td
                    className={cn(
                      "py-2 text-right tabular-nums",
                      d ? "text-danger font-medium" : "text-text-muted",
                    )}
                  >
                    {d === null
                      ? "—"
                      : d === 0
                        ? "OK"
                        : `${d > 0 ? "+" : "−"}${formatBRL(Math.abs(d))}`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {complete && (
          <p
            className={cn(
              "font-medium",
              diff.totalCents === 0 ? "text-success" : "text-danger",
            )}
            role="status"
          >
            {diff.totalCents === 0
              ? "Tudo confere."
              : `Diferença total de ${diff.totalCents > 0 ? "+" : "−"}${formatBRL(Math.abs(diff.totalCents))}. Explique na observação.`}
          </p>
        )}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cash-note">
            Observação{diff.totalCents !== 0 && complete ? "" : " (opcional)"}
          </Label>
          <Textarea
            id="cash-note"
            value={note}
            maxLength={300}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Voltar
          </Button>
          <Button
            disabled={!complete || needsNote}
            loading={close.isPending}
            onClick={() =>
              close.mutate(
                { id: session.id, counted: countedFull, note },
                {
                  onSuccess: () => {
                    toast.success("Caixa fechado");
                    onClose();
                  },
                  onError: () =>
                    toast.error(
                      "Não foi possível fechar o caixa. Tente de novo.",
                    ),
                },
              )
            }
          >
            Fechar caixa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
