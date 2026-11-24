"use client";

/**
 * Identificação por telefone + código (RF-05), sem senha. No primeiro acesso
 * pede o nome e, opcionalmente, "Como conheceu?". Usado em /entrar e no agendamento.
 */
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClientSourceSchema, PhoneInputSchema, type Client } from "@/domain/entities";
import { useRequestCode, useVerifyCode } from "@/features/auth/hooks/useClientAuth";
import { formatPhone } from "@/lib/format";
import { CLIENT_SOURCE_LABEL } from "@/lib/labels";

const PhoneFormSchema = z.object({ phone: PhoneInputSchema });

const CodeFormSchema = z.object({
  code: z.string().trim().regex(/^\d{4}$/, { message: "O código tem 4 números." }),
  name: z.string().trim().optional(),
  source: ClientSourceSchema.optional(),
  marketingConsent: z.boolean(),
});

type PhoneSignInProps = {
  onSignedIn: (client: Client) => void;
};

export function PhoneSignIn({ onSignedIn }: PhoneSignInProps) {
  const [pending, setPending] = useState<{ phone: string; code: string; isNewClient: boolean } | null>(null);
  const requestCode = useRequestCode();

  if (!pending) {
    return (
      <PhoneStep
        loading={requestCode.isPending}
        onSubmit={(phone) =>
          requestCode.mutate(phone, { onSuccess: (result) => setPending({ phone, ...result }) })
        }
        error={requestCode.isError ? "Não foi possível enviar o código. Tente de novo." : null}
      />
    );
  }
  return <CodeStep {...pending} onBack={() => setPending(null)} onSignedIn={onSignedIn} />;
}

function PhoneStep({
  loading,
  error,
  onSubmit,
}: {
  loading: boolean;
  error: string | null;
  onSubmit: (phone: string) => void;
}) {
  const form = useForm({ resolver: zodResolver(PhoneFormSchema), defaultValues: { phone: "" } });
  const fieldError = form.formState.errors.phone?.message;
  return (
    <form className="flex flex-col gap-4" onSubmit={form.handleSubmit((v) => onSubmit(v.phone))} noValidate>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="phone">Seu celular com DDD</Label>
        <Input
          id="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          placeholder="(61) 99999-9999"
          aria-invalid={!!fieldError}
          aria-describedby={fieldError ? "phone-error" : "phone-hint"}
          {...form.register("phone")}
        />
        {fieldError ? (
          <p id="phone-error" className="text-sm text-danger">
            {fieldError}
          </p>
        ) : (
          <p id="phone-hint" className="text-sm text-text-muted">
            Vamos enviar um código para confirmar que é você. Sem senha.
          </p>
        )}
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <Button type="submit" loading={loading}>
        Receber código
      </Button>
    </form>
  );
}

function CodeStep({
  phone,
  code: demoCode,
  isNewClient,
  onBack,
  onSignedIn,
}: {
  phone: string;
  code: string;
  isNewClient: boolean;
  onBack: () => void;
  onSignedIn: (client: Client) => void;
}) {
  const verify = useVerifyCode();
  const schema = isNewClient
    ? CodeFormSchema.refine((v) => (v.name ?? "").length >= 2, {
        path: ["name"],
        message: "Informe seu nome",
      })
    : CodeFormSchema;
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { code: "", name: "", source: undefined, marketingConsent: false },
  });
  const errors = form.formState.errors;

  const submit = form.handleSubmit((v) =>
    verify.mutate(
      {
        phone,
        code: v.code,
        profile: isNewClient
          ? { name: v.name ?? "", source: v.source, marketingConsent: v.marketingConsent }
          : undefined,
      },
      { onSuccess: onSignedIn },
    ),
  );

  return (
    <form className="flex flex-col gap-4" onSubmit={submit} noValidate>
      <p className="text-sm">
        Enviamos um código para <strong className="tabular-nums">{formatPhone(phone)}</strong>.{" "}
        <button type="button" onClick={onBack} className="text-primary underline underline-offset-4">
          Trocar número
        </button>
      </p>
      <p className="rounded-control bg-club px-3 py-2 text-sm text-club-fg">
        Demonstração: o código é <strong className="tabular-nums">{demoCode}</strong>. Na versão final ele chega por
        SMS ou WhatsApp.
      </p>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="code">Código</Label>
        <Input
          id="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={4}
          className="tabular-nums"
          aria-invalid={!!errors.code || verify.isError}
          {...form.register("code")}
        />
        {errors.code && <p className="text-sm text-danger">{errors.code.message}</p>}
        {verify.isError && !errors.code && (
          <p className="text-sm text-danger">Código incorreto. Confira o código e tente de novo.</p>
        )}
      </div>

      {isNewClient && (
        <>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Seu nome</Label>
            <Input id="name" autoComplete="name" aria-invalid={!!errors.name} {...form.register("name")} />
            {errors.name && <p className="text-sm text-danger">{errors.name.message}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="source">Como conheceu a barbearia? (opcional)</Label>
            <Controller
              control={form.control}
              name="source"
              render={({ field }) => (
                <Select value={field.value ?? ""} onValueChange={field.onChange}>
                  <SelectTrigger id="source" className="h-11 w-full">
                    <SelectValue placeholder="Escolha uma opção" />
                  </SelectTrigger>
                  <SelectContent>
                    {ClientSourceSchema.options.map((s) => (
                      <SelectItem key={s} value={s}>
                        {CLIENT_SOURCE_LABEL[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <Controller
            control={form.control}
            name="marketingConsent"
            render={({ field }) => (
              <div className="flex items-start gap-3">
                <Checkbox
                  id="consent"
                  checked={field.value}
                  onCheckedChange={(v) => field.onChange(v === true)}
                  className="mt-0.5"
                />
                <Label htmlFor="consent" className="text-sm leading-snug font-normal">
                  Quero receber novidades e promoções pelo WhatsApp. Dá para sair quando quiser.
                </Label>
              </div>
            )}
          />
        </>
      )}

      <Button type="submit" loading={verify.isPending}>
        {isNewClient ? "Criar cadastro e continuar" : "Entrar"}
      </Button>
    </form>
  );
}
