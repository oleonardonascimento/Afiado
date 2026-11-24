"use client";

/** Editar cadastro do cliente (painel e "Meu perfil"): nome, celular, e-mail, aniversário, origem, tags, notas. */
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { FormField } from "@/components/shared/FormField";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  ClientSourceSchema,
  PhoneInputSchema,
  type Client,
} from "@/domain/entities";
import {
  useClients,
  useUpdateClient,
} from "@/features/clients/hooks/useClients";
import { formatPhone } from "@/lib/format";
import { CLIENT_SOURCE_LABEL } from "@/lib/labels";

const FormSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome (mínimo 2 letras)."),
  phone: PhoneInputSchema,
  email: z.union([z.literal(""), z.email("E-mail inválido.")]),
  birthday: z.union([z.literal(""), z.iso.date("Data inválida.")]),
  source: z.union([ClientSourceSchema, z.literal("none")]),
  tags: z.string(),
  notes: z.string().max(500, "Use até 500 caracteres."),
  marketingConsent: z.boolean(),
});
type FormInput = z.input<typeof FormSchema>;
type FormOutput = z.output<typeof FormSchema>;

type ClientFormDialogProps = {
  client: Client;
  mode: "panel" | "self";
  onClose: () => void;
};

export function ClientFormDialog({
  client,
  mode,
  onClose,
}: ClientFormDialogProps) {
  const update = useUpdateClient();
  const clients = useClients();
  const form = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: client.name,
      phone: formatPhone(client.phone),
      email: client.email ?? "",
      birthday: client.birthday ?? "",
      source: client.source ?? "none",
      tags: client.tags.join(", "),
      notes: client.notes,
      marketingConsent: client.marketingConsent,
    },
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((v) => {
    if (clients.data?.some((c) => c.id !== client.id && c.phone === v.phone)) {
      form.setError("phone", { message: "Outro cliente já usa esse celular." });
      return;
    }
    update.mutate(
      {
        id: client.id,
        patch: {
          name: v.name,
          phone: v.phone,
          email: v.email || null,
          birthday: v.birthday || null,
          source: v.source === "none" ? null : v.source,
          tags: v.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          notes: v.notes.trim(),
          marketingConsent: v.marketingConsent,
        },
      },
      {
        onSuccess: () => {
          toast.success(
            mode === "self" ? "Perfil atualizado" : "Cadastro atualizado",
          );
          onClose();
        },
        onError: () => toast.error("Não foi possível salvar. Tente de novo."),
      },
    );
  });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-dvh overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "self" ? "Editar meus dados" : `Editar ${client.name}`}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <FormField id="cli-name" label="Nome" error={errors.name?.message}>
            <Input autoComplete="name" {...form.register("name")} />
          </FormField>
          <FormField
            id="cli-phone"
            label="Celular com DDD"
            error={errors.phone?.message}
          >
            <Input
              inputMode="tel"
              autoComplete="tel"
              {...form.register("phone")}
            />
          </FormField>
          <FormField
            id="cli-email"
            label="E-mail (opcional)"
            error={errors.email?.message}
          >
            <Input
              type="email"
              autoComplete="email"
              {...form.register("email")}
            />
          </FormField>
          <FormField
            id="cli-birthday"
            label="Aniversário (opcional)"
            error={errors.birthday?.message}
          >
            <Input type="date" {...form.register("birthday")} />
          </FormField>
          {mode === "panel" && (
            <>
              <FormField id="cli-source" label="Como conheceu">
                <Controller
                  control={form.control}
                  name="source"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Não informado</SelectItem>
                        {ClientSourceSchema.options.map((s) => (
                          <SelectItem key={s} value={s}>
                            {CLIENT_SOURCE_LABEL[s]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>
              <FormField
                id="cli-tags"
                label="Etiquetas"
                hint="Separe por vírgula. Ex.: VIP, prefere manhã"
              >
                <Input {...form.register("tags")} />
              </FormField>
              <FormField
                id="cli-notes"
                label="Observações e preferências"
                error={errors.notes?.message}
              >
                <Textarea {...form.register("notes")} />
              </FormField>
            </>
          )}
          <label className="flex items-start gap-3 text-sm">
            <Controller
              control={form.control}
              name="marketingConsent"
              render={({ field }) => (
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(v) => field.onChange(v === true)}
                  className="mt-0.5"
                />
              )}
            />
            {mode === "self"
              ? "Quero receber novidades e lembretes pelo WhatsApp."
              : "Aceita receber mensagens de marketing."}
          </label>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Voltar
            </Button>
            <Button type="submit" loading={update.isPending}>
              Salvar alterações
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
