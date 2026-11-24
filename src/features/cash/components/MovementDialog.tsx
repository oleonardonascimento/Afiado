"use client";

/** Lançar entrada, saída ou sangria no caixa aberto. Sangria é sempre em dinheiro. */
import { useState } from "react";
import { toast } from "sonner";
import { MoneyInput } from "@/components/shared/MoneyInput";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OperationError } from "@/data/repositories";
import { PAYMENT_METHODS, PaymentMethodSchema, type PaymentMethod } from "@/domain/entities";
import { useAddMovement } from "@/features/cash/hooks/useCash";
import { PAYMENT_METHOD_LABEL } from "@/lib/labels";

const COPY = {
  income: { title: "Lançar entrada", hint: "Dinheiro que entrou fora de comanda.", action: "Lançar entrada", done: "Entrada lançada" },
  expense: { title: "Lançar saída", hint: "Pagamento feito com dinheiro do caixa.", action: "Lançar saída", done: "Saída lançada" },
  withdrawal: { title: "Fazer sangria", hint: "Retirada de dinheiro da gaveta para guardar.", action: "Fazer sangria", done: "Sangria registrada" },
} as const;

export function MovementDialog({ kind, onClose }: { kind: keyof typeof COPY; onClose: () => void }) {
  const add = useAddMovement();
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [amount, setAmount] = useState<number | null>(null);
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const copy = COPY[kind];

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.hint}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          {kind !== "withdrawal" && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="mov-method">Forma</Label>
              <Select
                value={method}
                onValueChange={(v) => {
                  const parsed = PaymentMethodSchema.safeParse(v);
                  if (parsed.success) setMethod(parsed.data);
                }}
              >
                <SelectTrigger id="mov-method">
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
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="mov-amount">Valor</Label>
            <MoneyInput id="mov-amount" value={amount} onChange={setAmount} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="mov-desc">Descrição</Label>
            <Input id="mov-desc" value={description} maxLength={80} onChange={(e) => setDescription(e.target.value)} />
          </div>
          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Voltar
          </Button>
          <Button
            loading={add.isPending}
            onClick={() => {
              if (!amount) return setError("Informe um valor maior que zero.");
              if (!description.trim()) return setError("Descreva o movimento para conferir depois.");
              add.mutate(
                { kind, method: kind === "withdrawal" ? "cash" : method, amountCents: amount, description: description.trim() },
                {
                  onSuccess: () => {
                    toast.success(copy.done);
                    onClose();
                  },
                  onError: (e) => setError(e instanceof OperationError ? e.message : "Não foi possível lançar. Tente de novo."),
                },
              );
            }}
          >
            {copy.action}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
