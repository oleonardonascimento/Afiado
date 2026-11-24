"use client";

/** Aba "Agendamento": antecedência, prazo de cancelamento, intervalo entre horários, etc. */
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { FormField } from "@/components/shared/FormField";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import type { BookingRules } from "@/domain/entities";
import { useUpdateShop } from "@/features/settings/hooks/useCatalogAdmin";

const Whole = (min: number, max: number) =>
  z
    .number({ message: "Informe um número." })
    .int("Use um número inteiro.")
    .min(min, `Mínimo ${min}.`)
    .max(max, `Máximo ${max}.`);

const FormSchema = z.object({
  minAdvanceMinutes: Whole(0, 1440),
  maxDaysAhead: Whole(1, 180),
  cancelDeadlineHours: Whole(0, 72),
  bufferMinutes: Whole(0, 60),
  slotStepMinutes: z
    .number({ message: "Informe um número." })
    .refine(
      (v) => [10, 15, 20, 30].includes(v),
      "Use 10, 15, 20 ou 30 minutos.",
    ),
  allowAnyProfessional: z.boolean(),
});

const FIELDS: {
  name: Exclude<keyof BookingRules, "allowAnyProfessional">;
  label: string;
  hint: string;
}[] = [
  {
    name: "minAdvanceMinutes",
    label: "Antecedência mínima (minutos)",
    hint: "Ex.: 60 = não aceita agendar para daqui a menos de 1 hora.",
  },
  {
    name: "maxDaysAhead",
    label: "Agendar até quantos dias à frente",
    hint: "Limite do calendário do cliente.",
  },
  {
    name: "cancelDeadlineHours",
    label: "Prazo para cancelar ou remarcar (horas)",
    hint: "Depois disso, só pelo WhatsApp.",
  },
  {
    name: "bufferMinutes",
    label: "Intervalo entre atendimentos (minutos)",
    hint: "Tempo de limpeza entre um cliente e outro.",
  },
  {
    name: "slotStepMinutes",
    label: "Horários de quanto em quanto (minutos)",
    hint: "10, 15, 20 ou 30.",
  },
];

export function BookingRulesForm({ rules }: { rules: BookingRules }) {
  const update = useUpdateShop();
  const form = useForm<BookingRules>({
    resolver: zodResolver(FormSchema),
    defaultValues: rules,
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((booking) =>
    update.mutate(
      { booking },
      {
        onSuccess: () => toast.success("Regras de agendamento salvas"),
        onError: () => toast.error("Não foi possível salvar. Tente de novo."),
      },
    ),
  );

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        {FIELDS.map((f) => (
          <FormField
            key={f.name}
            id={`rule-${f.name}`}
            label={f.label}
            hint={f.hint}
            error={errors[f.name]?.message}
          >
            <Input
              type="number"
              inputMode="numeric"
              {...form.register(f.name, { valueAsNumber: true })}
            />
          </FormField>
        ))}
      </div>
      <label className="flex items-start gap-3 text-sm">
        <Controller
          control={form.control}
          name="allowAnyProfessional"
          render={({ field }) => (
            <Checkbox
              className="mt-0.5"
              checked={field.value}
              onCheckedChange={(v) => field.onChange(v === true)}
            />
          )}
        />
        Mostrar a opção “Qualquer barbeiro disponível” no agendamento online
      </label>
      <Button type="submit" className="self-end" loading={update.isPending}>
        Salvar regras
      </Button>
    </form>
  );
}
