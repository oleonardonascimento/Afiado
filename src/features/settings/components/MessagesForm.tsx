"use client";

/** Aba "Mensagens": modelos de WhatsApp com {nome}, {data} e {hora}, e prévia preenchida. */
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { FormField } from "@/components/shared/FormField";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Barbershop } from "@/domain/entities";
import { fillTemplate } from "@/domain/booking-policy";
import { useUpdateShop } from "@/features/settings/hooks/useCatalogAdmin";

type Messages = Barbershop["messages"];

const Template = z
  .string()
  .trim()
  .min(10, "Escreva a mensagem (mínimo 10 letras).")
  .max(500, "Use até 500 caracteres.");
const FormSchema = z.object({
  confirmation: Template,
  reminder: Template,
  missYou: Template,
});

const FIELDS: { name: keyof Messages; label: string }[] = [
  { name: "confirmation", label: "Confirmação do agendamento" },
  { name: "reminder", label: "Lembrete na véspera" },
  { name: "missYou", label: "Cliente sumido" },
];

const EXAMPLE = { nome: "Carlos", data: "sexta, 28/11", hora: "14:00" };

export function MessagesForm({ messages }: { messages: Messages }) {
  const update = useUpdateShop();
  const form = useForm<Messages>({
    resolver: zodResolver(FormSchema),
    defaultValues: messages,
  });
  const { errors } = form.formState;
  const values = useWatch({ control: form.control });

  const onSubmit = form.handleSubmit((next) =>
    update.mutate(
      { messages: next },
      {
        onSuccess: () => toast.success("Mensagens salvas"),
        onError: () => toast.error("Não foi possível salvar. Tente de novo."),
      },
    ),
  );

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6" noValidate>
      <p className="text-text-muted text-sm">
        Use {"{nome}"}, {"{data}"} e {"{hora}"} — o painel troca pelos dados do
        cliente ao abrir o WhatsApp.
      </p>
      {FIELDS.map((f) => (
        <div key={f.name} className="flex flex-col gap-2">
          <FormField
            id={`msg-${f.name}`}
            label={f.label}
            error={errors[f.name]?.message}
          >
            <Textarea rows={3} {...form.register(f.name)} />
          </FormField>
          <p className="rounded-control bg-surface-2 px-3 py-2 text-sm">
            <span className="text-text-muted">Prévia: </span>
            {fillTemplate(values[f.name] ?? "", EXAMPLE)}
          </p>
        </div>
      ))}
      <Button type="submit" className="self-end" loading={update.isPending}>
        Salvar mensagens
      </Button>
    </form>
  );
}
