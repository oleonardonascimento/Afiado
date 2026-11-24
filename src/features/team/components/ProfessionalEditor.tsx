"use client";

/** A12: ficha de um membro da equipe — dados, comissão, serviços, horários e folgas. */
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { FormField } from "@/components/shared/FormField";
import { MoneyInput } from "@/components/shared/MoneyInput";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { WeeklyHoursEditor } from "@/components/shared/WeeklyHoursEditor";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  StaffRoleSchema,
  WeeklyHoursSchema,
  type Professional,
  type Service,
} from "@/domain/entities";
import { weeklyHoursProblem } from "@/domain/shop";
import {
  useProfessionals,
  useServices,
  useShop,
} from "@/features/catalog/hooks/useCatalog";
import { useSaveProfessional } from "@/features/settings/hooks/useCatalogAdmin";
import { TimeOffList } from "@/features/team/components/TimeOffList";
import { ROLE_LABEL } from "@/lib/labels";

const OverridePct = z.union([
  z.literal(""),
  z
    .string()
    .refine((v) => Number(v) >= 0 && Number(v) <= 100, "Use de 0 a 100."),
]);

const FormSchema = z
  .object({
    name: z.string().trim().min(2, "Informe o nome (mínimo 2 letras)."),
    role: StaffRoleSchema,
    bio: z.string().max(280, "Use até 280 caracteres."),
    specialties: z.string(),
    commissionPct: z
      .number({ message: "Informe a comissão." })
      .min(0, "Use de 0 a 100.")
      .max(100, "Use de 0 a 100."),
    clubCommissionCents: z.number().int().nonnegative(),
    serviceIds: z.array(z.string()),
    overrides: z.record(z.string(), OverridePct),
    hours: z.array(WeeklyHoursSchema),
    active: z.boolean(),
  })
  .superRefine((v, ctx) => {
    const problem = weeklyHoursProblem(v.hours);
    if (problem)
      ctx.addIssue({ code: "custom", path: ["hours"], message: problem });
  });
type FormValues = z.infer<typeof FormSchema>;

export function ProfessionalEditor({ id }: { id: string }) {
  const professionals = useProfessionals();
  const services = useServices();
  const shop = useShop();

  if (professionals.isError || services.isError)
    return <ErrorState onRetry={() => void professionals.refetch()} />;
  if (professionals.isLoading || services.isLoading || shop.isLoading) {
    return <Skeleton className="rounded-card mx-auto h-96 max-w-3xl" />;
  }
  const isNew = id === "novo";
  const pro = professionals.data?.find((p) => p.id === id) ?? null;
  if (!isNew && !pro) {
    return (
      <EmptyState
        title="Pessoa não encontrada"
        description="O cadastro pode ter sido removido."
      >
        <Button asChild variant="secondary">
          <Link href="/admin/equipe">Ver equipe</Link>
        </Button>
      </EmptyState>
    );
  }
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Link
        href="/admin/equipe"
        className="text-text-muted hover:text-text inline-flex items-center gap-1 self-start text-sm"
      >
        <ArrowLeft className="size-4" strokeWidth={1.75} aria-hidden />
        Equipe
      </Link>
      <h1 className="text-2xl font-semibold">
        {pro ? pro.name : "Nova pessoa na equipe"}
      </h1>
      <ProfessionalForm
        pro={pro}
        services={(services.data ?? []).filter((s) => s.active)}
        defaultHours={shop.data?.hours ?? []}
      />
      {pro && pro.role !== "reception" && (
        <TimeOffList professionalId={pro.id} />
      )}
    </div>
  );
}

type ProfessionalFormProps = {
  pro: Professional | null;
  services: Service[];
  defaultHours: Professional["hours"];
};

function ProfessionalForm({
  pro,
  services,
  defaultHours,
}: ProfessionalFormProps) {
  const router = useRouter();
  const save = useSaveProfessional();
  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: pro?.name ?? "",
      role: pro?.role ?? "barber",
      bio: pro?.bio ?? "",
      specialties: pro?.specialties.join(", ") ?? "",
      commissionPct: pro?.commissionPct ?? 40,
      clubCommissionCents: pro?.clubCommissionCents ?? 1500,
      serviceIds: pro?.serviceIds ?? [],
      overrides: Object.fromEntries(
        Object.entries(pro?.commissionOverrides ?? {}).map(([k, v]) => [
          k,
          String(v),
        ]),
      ),
      hours: pro?.hours ?? defaultHours,
      active: pro?.active ?? true,
    },
  });
  const { errors } = form.formState;
  const role = useWatch({ control: form.control, name: "role" });

  const onSubmit = form.handleSubmit((v) => {
    const data: Omit<Professional, "id"> = {
      name: v.name,
      role: v.role,
      bio: v.bio.trim(),
      specialties: v.specialties
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      photoUrl: pro?.photoUrl ?? null,
      serviceIds: v.serviceIds,
      commissionPct: v.commissionPct,
      commissionOverrides: Object.fromEntries(
        Object.entries(v.overrides)
          .filter(([sid, pct]) => pct !== "" && v.serviceIds.includes(sid))
          .map(([sid, pct]) => [sid, Number(pct)]),
      ),
      clubCommissionCents: v.clubCommissionCents,
      hours: v.hours,
      active: v.active,
    };
    save.mutate(
      { id: pro?.id ?? null, data },
      {
        onSuccess: (saved) => {
          toast.success(
            pro ? "Cadastro atualizado" : "Pessoa adicionada à equipe",
          );
          if (!pro) router.replace(`/admin/equipe/${saved.id}`);
        },
        onError: () => toast.error("Não foi possível salvar. Tente de novo."),
      },
    );
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6" noValidate>
      <section aria-labelledby="pro-data" className="flex flex-col gap-4">
        <h2 id="pro-data" className="text-lg font-semibold">
          Dados
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="pro-name" label="Nome" error={errors.name?.message}>
            <Input autoComplete="name" {...form.register("name")} />
          </FormField>
          <FormField id="pro-role" label="Papel no painel">
            <Controller
              control={form.control}
              name="role"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {StaffRoleSchema.options.map((r) => (
                      <SelectItem key={r} value={r}>
                        {ROLE_LABEL[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>
        </div>
        {role !== "reception" && (
          <>
            <FormField
              id="pro-bio"
              label="Apresentação (aparece na página do barbeiro)"
              error={errors.bio?.message}
            >
              <Textarea {...form.register("bio")} />
            </FormField>
            <FormField
              id="pro-specialties"
              label="Especialidades"
              hint="Separe por vírgula. Ex.: degradê, barba desenhada"
            >
              <Input {...form.register("specialties")} />
            </FormField>
          </>
        )}
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
          Ativo (aparece na agenda e no agendamento online)
        </label>
      </section>

      {role !== "reception" && (
        <>
          <section
            aria-labelledby="pro-commission"
            className="flex flex-col gap-4"
          >
            <h2 id="pro-commission" className="text-lg font-semibold">
              Comissão
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                id="pro-pct"
                label="Comissão padrão (%)"
                hint="Usada quando o serviço não tem exceção abaixo."
                error={errors.commissionPct?.message}
              >
                <Input
                  type="number"
                  min={0}
                  max={100}
                  {...form.register("commissionPct", { valueAsNumber: true })}
                />
              </FormField>
              <FormField
                id="pro-club"
                label="Por atendimento do Clube"
                hint="Valor fixo pago por atendimento coberto pelo plano."
              >
                <Controller
                  control={form.control}
                  name="clubCommissionCents"
                  render={({ field }) => (
                    <MoneyInput
                      value={field.value}
                      onChange={(c) => field.onChange(c ?? 0)}
                    />
                  )}
                />
              </FormField>
            </div>
          </section>

          <section
            aria-labelledby="pro-services"
            className="flex flex-col gap-2"
          >
            <h2 id="pro-services" className="text-lg font-semibold">
              Serviços que faz
            </h2>
            <p className="text-text-muted text-sm">
              Deixe a exceção em branco para usar a comissão padrão.
            </p>
            <Controller
              control={form.control}
              name="serviceIds"
              render={({ field }) => (
                <ul className="divide-border rounded-card border-border flex flex-col divide-y border">
                  {services.map((s) => {
                    const checked = field.value.includes(s.id);
                    return (
                      <li
                        key={s.id}
                        className="flex flex-wrap items-center justify-between gap-2 px-3 py-1"
                      >
                        <label className="flex min-h-11 items-center gap-3 text-sm">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(v) =>
                              field.onChange(
                                v
                                  ? [...field.value, s.id]
                                  : field.value.filter((x) => x !== s.id),
                              )
                            }
                          />
                          {s.name}
                        </label>
                        {checked && (
                          <span className="text-text-muted flex items-center gap-2 text-sm">
                            <label htmlFor={`ovr-${s.id}`}>Exceção (%)</label>
                            <Input
                              id={`ovr-${s.id}`}
                              type="number"
                              min={0}
                              max={100}
                              className="w-20"
                              placeholder="padrão"
                              aria-invalid={
                                errors.overrides?.[s.id] ? true : undefined
                              }
                              {...form.register(`overrides.${s.id}`)}
                            />
                            {errors.overrides?.[s.id]?.message && (
                              <span className="text-danger">
                                {errors.overrides[s.id]?.message}
                              </span>
                            )}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            />
          </section>

          <section aria-labelledby="pro-hours" className="flex flex-col gap-2">
            <h2 id="pro-hours" className="text-lg font-semibold">
              Horário de trabalho
            </h2>
            <Controller
              control={form.control}
              name="hours"
              render={({ field }) => (
                <WeeklyHoursEditor
                  value={field.value}
                  onChange={field.onChange}
                  closedLabel="Folga"
                />
              )}
            />
            {errors.hours?.message && (
              <p role="alert" className="text-danger text-sm">
                {errors.hours.message}
              </p>
            )}
          </section>
        </>
      )}

      <div className="flex justify-end">
        <Button type="submit" loading={save.isPending}>
          {pro ? "Salvar alterações" : "Adicionar à equipe"}
        </Button>
      </div>
    </form>
  );
}
