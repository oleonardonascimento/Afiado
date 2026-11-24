"use client";

/** A10: serviços por categoria + formulário (preço, duração, comissão, barbeiros, online, ativo). */
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { FormField } from "@/components/shared/FormField";
import { MoneyInput } from "@/components/shared/MoneyInput";
import { PageHeader } from "@/components/shared/PageHeader";
import { ErrorState } from "@/components/shared/states";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  ServiceCategorySchema,
  ServiceSchema,
  type Professional,
  type Service,
} from "@/domain/entities";
import {
  useProfessionals,
  useServices,
} from "@/features/catalog/hooks/useCatalog";
import { useSaveServiceWithTeam } from "@/features/settings/hooks/useCatalogAdmin";
import { cn } from "@/lib/cn";
import { formatBRL } from "@/lib/format";
import { SERVICE_CATEGORY_LABEL, durationLabel, firstName } from "@/lib/labels";

const DURATIONS = [15, 30, 45, 60, 75, 90, 120, 150, 180];

export function ServicesAdmin() {
  const services = useServices();
  const professionals = useProfessionals();
  const [editing, setEditing] = useState<Service | "new" | null>(null);

  if (services.isError)
    return <ErrorState onRetry={() => void services.refetch()} />;
  if (services.isLoading || professionals.isLoading)
    return <Skeleton className="rounded-card mx-auto h-96 max-w-4xl" />;
  const team = (professionals.data ?? []).filter(
    (p) => p.active && p.role !== "reception",
  );

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <PageHeader title="Serviços">
        <Button onClick={() => setEditing("new")}>
          <Plus strokeWidth={1.75} aria-hidden />
          Novo serviço
        </Button>
      </PageHeader>
      {ServiceCategorySchema.options.map((category) => {
        const list = (services.data ?? []).filter(
          (s) => s.category === category,
        );
        if (list.length === 0) return null;
        return (
          <section
            key={category}
            aria-labelledby={`cat-${category}`}
            className="flex flex-col gap-2"
          >
            <h2 id={`cat-${category}`} className="text-lg font-semibold">
              {SERVICE_CATEGORY_LABEL[category]}
            </h2>
            <ul className="divide-border rounded-card border-border bg-surface divide-y border">
              {list.map((s) => {
                const who = team.filter((p) => p.serviceIds.includes(s.id));
                return (
                  <li
                    key={s.id}
                    className={cn(
                      "flex items-center justify-between gap-3 px-4 py-3",
                      !s.active && "opacity-70",
                    )}
                  >
                    <span className="min-w-0">
                      <span className="block font-medium">
                        {s.name}
                        {!s.active && (
                          <span className="text-text-muted ml-2 text-sm font-normal">
                            inativo
                          </span>
                        )}
                        {s.active && !s.onlineBooking && (
                          <span className="text-text-muted ml-2 text-sm font-normal">
                            só no balcão
                          </span>
                        )}
                      </span>
                      <span className="text-text-muted block truncate text-sm">
                        {durationLabel(s.durationMinutes)} · comissão{" "}
                        {s.commissionPct}% ·{" "}
                        {who.length === 0
                          ? "nenhum barbeiro"
                          : who.map((p) => firstName(p.name)).join(", ")}
                      </span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="tabular-nums">
                        {formatBRL(s.priceCents)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Editar ${s.name}`}
                        onClick={() => setEditing(s)}
                      >
                        <Pencil strokeWidth={1.75} aria-hidden />
                      </Button>
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
      {editing && (
        <ServiceFormDialog
          service={editing === "new" ? null : editing}
          team={team}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

const FormSchema = ServiceSchema.omit({ id: true }).extend({
  name: z.string().trim().min(2, "Dê um nome com pelo menos 2 letras."),
  priceCents: z.number().int().nonnegative("Informe o preço."),
  commissionPct: z
    .number({ message: "Informe a comissão." })
    .min(0, "Use de 0 a 100.")
    .max(100, "Use de 0 a 100."),
  professionalIds: z.array(z.string()),
});
type FormValues = z.infer<typeof FormSchema>;

function ServiceFormDialog({
  service,
  team,
  onClose,
}: {
  service: Service | null;
  team: Professional[];
  onClose: () => void;
}) {
  const save = useSaveServiceWithTeam();
  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: service?.name ?? "",
      category: service?.category ?? "corte",
      priceCents: service?.priceCents ?? 0,
      durationMinutes: service?.durationMinutes ?? 30,
      commissionPct: service?.commissionPct ?? 40,
      onlineBooking: service?.onlineBooking ?? true,
      active: service?.active ?? true,
      professionalIds: service
        ? team.filter((p) => p.serviceIds.includes(service.id)).map((p) => p.id)
        : [],
    },
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit(({ professionalIds, ...data }) =>
    save.mutate(
      { id: service?.id ?? null, data, professionalIds, professionals: team },
      {
        onSuccess: () => {
          toast.success(service ? "Serviço atualizado" : "Serviço criado");
          onClose();
        },
        onError: () =>
          toast.error("Não foi possível salvar o serviço. Tente de novo."),
      },
    ),
  );

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-dvh overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {service ? `Editar ${service.name}` : "Novo serviço"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <FormField id="svc-name" label="Nome" error={errors.name?.message}>
            <Input {...form.register("name")} />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="svc-cat" label="Categoria">
              <Controller
                control={form.control}
                name="category"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ServiceCategorySchema.options.map((c) => (
                        <SelectItem key={c} value={c}>
                          {SERVICE_CATEGORY_LABEL[c]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>
            <FormField id="svc-duration" label="Duração">
              <Controller
                control={form.control}
                name="durationMinutes"
                render={({ field }) => (
                  <Select
                    value={String(field.value)}
                    onValueChange={(v) => field.onChange(Number(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DURATIONS.map((d) => (
                        <SelectItem key={d} value={String(d)}>
                          {durationLabel(d)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>
            <FormField
              id="svc-price"
              label="Preço"
              error={errors.priceCents?.message}
            >
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
            <FormField
              id="svc-commission"
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
          <Controller
            control={form.control}
            name="professionalIds"
            render={({ field }) => (
              <fieldset className="flex flex-col gap-1">
                <legend className="mb-1 text-sm font-medium">
                  Barbeiros que fazem
                </legend>
                {team.map((p) => (
                  <label
                    key={p.id}
                    className="flex min-h-11 items-center gap-3 text-sm"
                  >
                    <Checkbox
                      checked={field.value.includes(p.id)}
                      onCheckedChange={(v) =>
                        field.onChange(
                          v
                            ? [...field.value, p.id]
                            : field.value.filter((id) => id !== p.id),
                        )
                      }
                    />
                    {p.name}
                  </label>
                ))}
              </fieldset>
            )}
          />
          {(["onlineBooking", "active"] as const).map((name) => (
            <label key={name} className="flex items-center gap-3 text-sm">
              <Controller
                control={form.control}
                name={name}
                render={({ field }) => (
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(v) => field.onChange(v === true)}
                  />
                )}
              />
              {name === "onlineBooking"
                ? "Aparece no agendamento online"
                : "Serviço ativo"}
            </label>
          ))}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Voltar
            </Button>
            <Button type="submit" loading={save.isPending}>
              {service ? "Salvar serviço" : "Criar serviço"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
