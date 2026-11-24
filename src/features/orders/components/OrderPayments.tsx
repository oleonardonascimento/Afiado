"use client";

/** Formas de pagamento da comanda: uma ou mais, com "preencher o restante". */
import { Plus, Trash2 } from "lucide-react";
import { MoneyInput } from "@/components/shared/MoneyInput";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PAYMENT_METHODS, PaymentMethodSchema, type PaymentMethod } from "@/domain/entities";
import { PAYMENT_METHOD_LABEL } from "@/lib/labels";

export type PaymentDraft = { key: string; method: PaymentMethod; amountCents: number | null };

type OrderPaymentsProps = {
  payments: PaymentDraft[];
  remainingCents: number;
  onChange: (payments: PaymentDraft[]) => void;
};

export function OrderPayments({ payments, remainingCents, onChange }: OrderPaymentsProps) {
  const patch = (key: string, change: Partial<PaymentDraft>) =>
    onChange(payments.map((p) => (p.key === key ? { ...p, ...change } : p)));

  return (
    <section aria-labelledby="payments-title" className="flex flex-col gap-3">
      <h2 id="payments-title" className="text-lg font-semibold">
        Pagamento
      </h2>
      <ul className="flex flex-col gap-2">
        {payments.map((p, index) => (
          <li key={p.key} className="flex flex-wrap items-center gap-2">
            <Select
              value={p.method}
              onValueChange={(v) => {
                const parsed = PaymentMethodSchema.safeParse(v);
                if (parsed.success) patch(p.key, { method: parsed.data });
              }}
            >
              <SelectTrigger className="w-36" aria-label={`Forma de pagamento ${index + 1}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {PAYMENT_METHOD_LABEL[m]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <MoneyInput
              aria-label={`Valor pago em ${PAYMENT_METHOD_LABEL[p.method]}`}
              className="w-36"
              value={p.amountCents}
              onChange={(cents) => patch(p.key, { amountCents: cents })}
            />
            {remainingCents > 0 && (p.amountCents ?? 0) === 0 && (
              <Button variant="ghost" size="sm" onClick={() => patch(p.key, { amountCents: remainingCents })}>
                Preencher o restante
              </Button>
            )}
            {payments.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Remover forma de pagamento"
                onClick={() => onChange(payments.filter((x) => x.key !== p.key))}
              >
                <Trash2 strokeWidth={1.75} aria-hidden />
              </Button>
            )}
          </li>
        ))}
      </ul>
      <Button
        variant="ghost"
        size="sm"
        className="self-start"
        onClick={() =>
          onChange([...payments, { key: crypto.randomUUID(), method: "cash", amountCents: remainingCents || null }])
        }
      >
        <Plus strokeWidth={1.75} aria-hidden />
        Dividir em outra forma
      </Button>
    </section>
  );
}
