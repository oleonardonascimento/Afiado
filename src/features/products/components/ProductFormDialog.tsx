"use client";

/** Cadastro e edição de produto: nome, preço, custo, estoque, estoque mínimo, comissão e ativo. */
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { FormField } from "@/components/shared/FormField";
import { MoneyInput } from "@/components/shared/MoneyInput";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ProductSchema, type Product } from "@/domain/entities";
import { useSaveProduct } from "@/features/settings/hooks/useCatalogAdmin";

const Count = (label: string) =>
  z
    .number({ message: `Informe ${label}.` })
    .int("Use um número inteiro.")
    .nonnegative("Não pode ser negativo.");

const FormSchema = ProductSchema.omit({ id: true }).extend({
  name: z.string().trim().min(2, "Dê um nome com pelo menos 2 letras."),
  stock: Count("a quantidade"),
  minStock: Count("o estoque mínimo"),
  commissionPct: z
    .number({ message: "Informe a comissão." })
    .min(0, "Use de 0 a 100.")
    .max(100, "Use de 0 a 100."),
});
type FormValues = z.infer<typeof FormSchema>;

export function ProductFormDialog({
  product,
  onClose,
}: {
  product: Product | null;
  onClose: () => void;
}) {
  const save = useSaveProduct();
  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: product ?? {
      name: "",
      priceCents: 0,
      costCents: 0,
      stock: 0,
      minStock: 3,
      commissionPct: 10,
      active: true,
    },
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((data) =>
    save.mutate(
      { id: product?.id ?? null, data },
      {
        onSuccess: () => {
          toast.success(product ? "Produto atualizado" : "Produto cadastrado");
          onClose();
        },
        onError: () =>
          toast.error("Não foi possível salvar o produto. Tente de novo."),
      },
    ),
  );

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-dvh overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {product ? `Editar ${product.name}` : "Novo produto"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <FormField id="prod-name" label="Nome" error={errors.name?.message}>
            <Input {...form.register("name")} />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="prod-price" label="Preço de venda">
              <Controller
                control={form.control}
                name="priceCents"
                render={({ field }) => (
                  <MoneyInput
                    value={field.value}
                    onChange={(c) => field.onChange(c ?? 0)}
                  />
                )}
              />
            </FormField>
            <FormField id="prod-cost" label="Custo">
              <Controller
                control={form.control}
                name="costCents"
                render={({ field }) => (
                  <MoneyInput
                    value={field.value}
                    onChange={(c) => field.onChange(c ?? 0)}
                  />
                )}
              />
            </FormField>
            {!product && (
              <FormField
                id="prod-stock"
                label="Quantidade em estoque"
                error={errors.stock?.message}
              >
                <Input
                  type="number"
                  inputMode="numeric"
                  {...form.register("stock", { valueAsNumber: true })}
                />
              </FormField>
            )}
            <FormField
              id="prod-min"
              label="Estoque mínimo"
              hint="Abaixo disso, o produto aparece com alerta."
              error={errors.minStock?.message}
            >
              <Input
                type="number"
                inputMode="numeric"
                {...form.register("minStock", { valueAsNumber: true })}
              />
            </FormField>
            <FormField
              id="prod-commission"
              label="Comissão (%)"
              error={errors.commissionPct?.message}
            >
              <Input
                type="number"
                min={0}
                max={100}
                {...form.register("commissionPct", { valueAsNumber: true })}
              />
            </FormField>
          </div>
          <label className="flex items-center gap-3 text-sm">
            <Controller
              control={form.control}
              name="active"
              render={({ field }) => (
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(v) => field.onChange(v === true)}
                />
              )}
            />
            Produto ativo (aparece na comanda)
          </label>
          {product && (
            <p className="text-text-muted text-sm">
              Para mudar a quantidade, use “Ajustar estoque”.
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Voltar
            </Button>
            <Button type="submit" loading={save.isPending}>
              {product ? "Salvar produto" : "Cadastrar produto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
