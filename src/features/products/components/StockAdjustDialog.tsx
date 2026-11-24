"use client";

/** Ajuste manual de estoque: entrada (compra) ou saída (perda, uso interno). */
import { useState } from "react";
import { toast } from "sonner";
import { FormField } from "@/components/shared/FormField";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { Product } from "@/domain/entities";
import { stockAdjustProblem } from "@/domain/product";
import { useSaveProduct } from "@/features/settings/hooks/useCatalogAdmin";
import { cn } from "@/lib/cn";

export function StockAdjustDialog({
  product,
  onClose,
}: {
  product: Product;
  onClose: () => void;
}) {
  const save = useSaveProduct();
  const [direction, setDirection] = useState<"in" | "out">("in");
  const [quantity, setQuantity] = useState("");
  const [error, setError] = useState<string | null>(null);

  const delta = (direction === "in" ? 1 : -1) * Number(quantity || 0);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const problem = stockAdjustProblem(product.stock, delta);
    setError(problem);
    if (problem) return;
    const { id, ...data } = product;
    save.mutate(
      { id, data: { ...data, stock: product.stock + delta } },
      {
        onSuccess: () => {
          toast.success(
            `Estoque de ${product.name}: ${product.stock + delta} unidades`,
          );
          onClose();
        },
        onError: () =>
          toast.error("Não foi possível ajustar o estoque. Tente de novo."),
      },
    );
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajustar estoque</DialogTitle>
          <DialogDescription>
            {product.name}: {product.stock} em estoque agora.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-medium">Tipo de ajuste</legend>
            <div role="radiogroup" className="grid grid-cols-2 gap-2">
              {(["in", "out"] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  role="radio"
                  aria-checked={direction === d}
                  onClick={() => setDirection(d)}
                  className={cn(
                    "rounded-control focus-visible:outline-ring min-h-11 border px-3 text-sm focus-visible:outline-2",
                    direction === d
                      ? "border-primary bg-primary text-primary-fg"
                      : "border-border-strong hover:bg-surface-2",
                  )}
                >
                  {d === "in" ? "Entrada (compra)" : "Saída (perda, uso)"}
                </button>
              ))}
            </div>
          </fieldset>
          <FormField id="adj-qty" label="Quantidade" error={error ?? undefined}>
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </FormField>
          {delta !== 0 && !Number.isNaN(delta) && (
            <p className="text-text-muted text-sm tabular-nums">
              Fica com {product.stock + delta} unidades.
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Voltar
            </Button>
            <Button type="submit" loading={save.isPending}>
              {direction === "in" ? "Registrar entrada" : "Registrar saída"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
