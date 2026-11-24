"use client";

/** Criar/editar plano do Clube: nome, preço, benefícios por serviço (limite ou à vontade), regras, ativo. */
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
import { PlanSchema, type Plan, type Service } from "@/domain/entities";
import { useSavePlan } from "@/features/club/hooks/useClubAdmin";

const FormSchema = PlanSchema.omit({ id: true }).extend({
  name: z.string().trim().min(2, "Dê um nome com pelo menos 2 letras."),
  priceCents: z
    .number({ message: "Informe o preço." })
    .int()
    .positive("O preço precisa ser maior que zero."),
  benefits: PlanSchema.shape.benefits.min(
    1,
    "Escolha pelo menos um serviço incluído.",
  ),
});
type FormValues = z.infer<typeof FormSchema>;

const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6];

type PlanFormDialogProps = {
  plan: Plan | null;
  services: Service[];
  onClose: () => void;
};

export function PlanFormDialog({
  plan,
  services,
  onClose,
}: PlanFormDialogProps) {
  const save = useSavePlan();
  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: plan ?? {
      name: "",
      priceCents: 0,
      description: "",
      benefits: [],
      rules: { minDaysBetweenUses: 7, allowedWeekdays: EVERY_DAY },
      recommended: false,
      active: true,
    },
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) =>
    save.mutate(
      { id: plan?.id ?? null, plan: values },
      {
        onSuccess: () => {
          toast.success(plan ? "Plano atualizado" : "Plano criado");
          onClose();
        },
        onError: () =>
          toast.error("Não foi possível salvar o plano. Tente de novo."),
      },
    ),
  );

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-dvh overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {plan ? `Editar plano ${plan.name}` : "Novo plano"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <FormField id="plan-name" label="Nome" error={errors.name?.message}>
            <Input {...form.register("name")} />
          </FormField>
          <FormField
            id="plan-price"
            label="Preço por mês"
            error={errors.priceCents?.message}
          >
            <Controller
              control={form.control}
              name="priceCents"
              render={({ field }) => (
                <MoneyInput
                  value={field.value || null}
                  onChange={(c) => field.onChange(c ?? 0)}
                />
              )}
            />
          </FormField>
          <FormField id="plan-desc" label="Descrição curta">
            <Input {...form.register("description")} />
          </FormField>

          <Controller
            control={form.control}
            name="benefits"
            render={({ field }) => (
              <fieldset className="flex flex-col gap-2">
                <legend className="mb-1 text-sm font-medium">
                  Serviços incluídos
                </legend>
                <p className="text-text-muted text-sm">
                  Deixe o limite vazio para “à vontade”.
                </p>
                {services
                  .filter((s) => s.active)
                  .map((s) => {
                    const benefit = field.value.find(
                      (b) => b.serviceId === s.id,
                    );
                    return (
                      <div
                        key={s.id}
                        className="flex min-h-11 items-center gap-3"
                      >
                        <label className="flex flex-1 items-center gap-3 text-sm">
                          <Checkbox
                            checked={Boolean(benefit)}
                            onCheckedChange={(v) =>
                              field.onChange(
                                v
                                  ? [
                                      ...field.value,
                                      { serviceId: s.id, monthlyLimit: null },
                                    ]
                                  : field.value.filter(
                                      (b) => b.serviceId !== s.id,
                                    ),
                              )
                            }
                          />
                          {s.name}
                        </label>
                        {benefit && (
                          <Input
                            aria-label={`Limite por mês de ${s.name}`}
                            inputMode="numeric"
                            placeholder="à vontade"
                            className="w-28"
                            value={benefit.monthlyLimit ?? ""}
                            onChange={(e) => {
                              const n = Number.parseInt(e.target.value, 10);
                              field.onChange(
                                field.value.map((b) =>
                                  b.serviceId === s.id
                                    ? {
                                        ...b,
                                        monthlyLimit:
                                          Number.isFinite(n) && n > 0
                                            ? n
                                            : null,
                                      }
                                    : b,
                                ),
                              );
                            }}
                          />
                        )}
                      </div>
                    );
                  })}
                {errors.benefits?.message && (
                  <p className="text-danger text-sm">
                    {errors.benefits.message}
                  </p>
                )}
              </fieldset>
            )}
          />

          <FormField
            id="plan-gap"
            label="Intervalo mínimo entre usos (dias)"
            error={
              errors.rules?.minDaysBetweenUses?.message &&
              "Use um número de 0 a 60."
            }
          >
            <Input
              type="number"
              min={0}
              max={60}
              {...form.register("rules.minDaysBetweenUses", {
                valueAsNumber: true,
              })}
            />
          </FormField>

          <label className="flex items-center gap-3 text-sm">
            <Controller
              control={form.control}
              name="recommended"
              render={({ field }) => (
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(v) => field.onChange(v === true)}
                />
              )}
            />
            Destacar como plano recomendado
          </label>
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
            Plano ativo (aparece na página do Clube)
          </label>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Voltar
            </Button>
            <Button type="submit" loading={save.isPending}>
              {plan ? "Salvar plano" : "Criar plano"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
