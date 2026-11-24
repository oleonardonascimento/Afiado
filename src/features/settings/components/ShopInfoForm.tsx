"use client";

/** Aba "Barbearia": nome, apresentação, endereço e contatos. */
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { FormField } from "@/components/shared/FormField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PhoneInputSchema, type Barbershop } from "@/domain/entities";
import { useUpdateShop } from "@/features/settings/hooks/useCatalogAdmin";
import { formatPhone } from "@/lib/format";

const Required = (label: string) =>
  z.string().trim().min(1, `Informe ${label}.`);

const FormSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome da barbearia."),
  about: z.string().max(600, "Use até 600 caracteres."),
  street: Required("a rua"),
  number: Required("o número"),
  district: Required("o bairro"),
  city: Required("a cidade"),
  state: z.string().trim().length(2, "Use a sigla do estado, ex.: DF."),
  zip: z.string().regex(/^\d{5}-?\d{3}$/, "CEP com 8 dígitos."),
  phone: PhoneInputSchema,
  whatsapp: PhoneInputSchema,
  instagram: z.string().trim(),
});
type FormInput = z.input<typeof FormSchema>;
type FormOutput = z.output<typeof FormSchema>;

export function ShopInfoForm({ shop }: { shop: Barbershop }) {
  const update = useUpdateShop();
  const form = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: shop.name,
      about: shop.about,
      ...shop.address,
      phone: formatPhone(shop.phone),
      whatsapp: formatPhone(shop.whatsapp),
      instagram: shop.instagram,
    },
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit(
    ({ street, number, district, city, state, zip, instagram, ...rest }) =>
      update.mutate(
        {
          ...rest,
          instagram: instagram.replace(/^@/, ""),
          address: {
            street,
            number,
            district,
            city,
            state: state.toUpperCase(),
            zip,
          },
        },
        {
          onSuccess: () => toast.success("Dados da barbearia salvos"),
          onError: () => toast.error("Não foi possível salvar. Tente de novo."),
        },
      ),
  );

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <FormField
        id="shop-name"
        label="Nome da barbearia"
        error={errors.name?.message}
      >
        <Input {...form.register("name")} />
      </FormField>
      <FormField
        id="shop-about"
        label="Apresentação (página inicial)"
        error={errors.about?.message}
      >
        <Textarea {...form.register("about")} />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-3">
        <FormField
          id="shop-street"
          label="Rua"
          error={errors.street?.message}
          className="sm:col-span-2"
        >
          <Input autoComplete="address-line1" {...form.register("street")} />
        </FormField>
        <FormField
          id="shop-number"
          label="Número"
          error={errors.number?.message}
        >
          <Input {...form.register("number")} />
        </FormField>
        <FormField
          id="shop-district"
          label="Bairro"
          error={errors.district?.message}
        >
          <Input {...form.register("district")} />
        </FormField>
        <FormField id="shop-city" label="Cidade" error={errors.city?.message}>
          <Input autoComplete="address-level2" {...form.register("city")} />
        </FormField>
        <FormField id="shop-state" label="Estado" error={errors.state?.message}>
          <Input maxLength={2} {...form.register("state")} />
        </FormField>
        <FormField id="shop-zip" label="CEP" error={errors.zip?.message}>
          <Input
            inputMode="numeric"
            autoComplete="postal-code"
            {...form.register("zip")}
          />
        </FormField>
        <FormField
          id="shop-phone"
          label="Telefone"
          error={errors.phone?.message}
        >
          <Input inputMode="tel" {...form.register("phone")} />
        </FormField>
        <FormField
          id="shop-whatsapp"
          label="WhatsApp"
          error={errors.whatsapp?.message}
        >
          <Input inputMode="tel" {...form.register("whatsapp")} />
        </FormField>
      </div>
      <FormField
        id="shop-instagram"
        label="Instagram"
        hint="Só o usuário, sem o @."
      >
        <Input {...form.register("instagram")} />
      </FormField>
      <Button type="submit" className="self-end" loading={update.isPending}>
        Salvar dados
      </Button>
    </form>
  );
}
