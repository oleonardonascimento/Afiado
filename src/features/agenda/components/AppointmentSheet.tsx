"use client";

/** Painel lateral do agendamento: dados do cliente, serviços e ações de status. */
import {
  Check,
  CheckCheck,
  Crown,
  MessageCircle,
  Play,
  Receipt,
  UserX,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { AppointmentStatusBadge } from "@/components/shared/AppointmentStatusBadge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { fillTemplate } from "@/domain/booking-policy";
import type { Appointment, AppointmentStatus } from "@/domain/entities";
import {
  useCompleteAppointment,
  useSetAppointmentStatus,
} from "@/features/agenda/hooks/useAgenda";
import {
  useProfessionals,
  useServices,
  useShop,
} from "@/features/catalog/hooks/useCatalog";
import { useClients } from "@/features/clients/hooks/useClients";
import { formatBRL, formatDate, formatPhone, formatTime } from "@/lib/format";
import { capitalizeFirst, durationLabel, firstName } from "@/lib/labels";
import { whatsappLink } from "@/lib/whatsapp";

type AppointmentSheetProps = {
  appointmentId: string | null;
  appointments: Appointment[];
  clubClients: Set<string>;
  onClose: () => void;
};

const STATUS_TOAST: Partial<Record<AppointmentStatus, string>> = {
  confirmed: "Agendamento confirmado",
  in_service: "Atendimento iniciado",
  no_show: "Falta registrada",
  canceled: "Agendamento cancelado",
};

export function AppointmentSheet({
  appointmentId,
  appointments,
  clubClients,
  onClose,
}: AppointmentSheetProps) {
  const router = useRouter();
  const clients = useClients();
  const services = useServices();
  const professionals = useProfessionals();
  const shop = useShop();
  const setStatus = useSetAppointmentStatus();
  const complete = useCompleteAppointment();
  const [confirmCancel, setConfirmCancel] = useState(false);

  const apt = appointments.find((a) => a.id === appointmentId);
  const client = clients.data?.find((c) => c.id === apt?.clientId);
  const pro = professionals.data?.find((p) => p.id === apt?.professionalId);
  const chosen = (services.data ?? []).filter((s) =>
    apt?.serviceIds.includes(s.id),
  );
  const busy = setStatus.isPending || complete.isPending;

  const change = (status: AppointmentStatus) => {
    if (!apt) return;
    setStatus.mutate(
      { id: apt.id, status },
      {
        onSuccess: () =>
          toast.success(STATUS_TOAST[status] ?? "Agendamento atualizado"),
        onError: () =>
          toast.error("Não foi possível atualizar. Tente de novo."),
      },
    );
  };

  const when = apt ? capitalizeFirst(formatDate(apt.start, "EEEE, dd/MM")) : "";
  const reminder =
    apt && client && shop.data
      ? fillTemplate(shop.data.messages.reminder, {
          nome: firstName(client.name),
          data: formatDate(apt.start, "dd/MM"),
          hora: formatTime(apt.start),
        })
      : "";

  return (
    <Sheet open={Boolean(apt)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="flex w-full flex-col gap-5 overflow-y-auto sm:max-w-md">
        {apt && (
          <>
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                {client?.name ?? "Cliente"}
                {clubClients.has(apt.clientId) && (
                  <span className="bg-club text-club-fg inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium">
                    <Crown
                      className="size-3.5"
                      strokeWidth={1.75}
                      aria-hidden
                    />
                    Clube
                  </span>
                )}
              </SheetTitle>
              <SheetDescription>
                {when},{" "}
                <span className="tabular-nums">
                  {formatTime(apt.start)}–{formatTime(apt.end)}
                </span>{" "}
                com {pro?.name ?? "barbeiro"}
              </SheetDescription>
            </SheetHeader>

            <div className="flex flex-col gap-4 px-4">
              <AppointmentStatusBadge
                status={apt.status}
                className="self-start"
              />
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                <dt className="text-text-muted">Celular</dt>
                <dd className="tabular-nums">
                  {client ? formatPhone(client.phone) : "—"}
                </dd>
                <dt className="text-text-muted">Serviços</dt>
                <dd>
                  {chosen.map((s) => (
                    <span key={s.id} className="block">
                      {s.name} · {durationLabel(s.durationMinutes)}
                    </span>
                  ))}
                </dd>
                <dt className="text-text-muted">Valor</dt>
                <dd className="tabular-nums">{formatBRL(apt.priceCents)}</dd>
                <dt className="text-text-muted">Origem</dt>
                <dd>
                  {apt.origin === "online" ? "Agendamento online" : "Painel"}
                </dd>
                {apt.note && (
                  <>
                    <dt className="text-text-muted">Observação</dt>
                    <dd className="break-words">{apt.note}</dd>
                  </>
                )}
                {client?.notes && (
                  <>
                    <dt className="text-text-muted">Preferências</dt>
                    <dd className="break-words">{client.notes}</dd>
                  </>
                )}
              </dl>

              <div className="flex flex-col gap-2">
                {apt.status === "scheduled" && (
                  <Button
                    variant="secondary"
                    disabled={busy}
                    onClick={() => change("confirmed")}
                  >
                    <Check strokeWidth={1.75} aria-hidden />
                    Confirmar presença
                  </Button>
                )}
                {(apt.status === "scheduled" || apt.status === "confirmed") && (
                  <Button
                    variant="secondary"
                    disabled={busy}
                    onClick={() => change("in_service")}
                  >
                    <Play strokeWidth={1.75} aria-hidden />
                    Iniciar atendimento
                  </Button>
                )}
                {["scheduled", "confirmed", "in_service"].includes(
                  apt.status,
                ) && (
                  <Button
                    loading={complete.isPending}
                    disabled={busy}
                    onClick={() =>
                      complete.mutate(apt.id, {
                        onSuccess: (order) => {
                          toast.success(
                            "Atendimento concluído. Comanda aberta.",
                          );
                          router.push(`/admin/comandas/${order.id}`);
                        },
                        onError: (e) =>
                          toast.error(
                            e instanceof Error
                              ? e.message
                              : "Não foi possível concluir.",
                          ),
                      })
                    }
                  >
                    <CheckCheck strokeWidth={1.75} aria-hidden />
                    Concluir e abrir comanda
                  </Button>
                )}
                {apt.orderId && (
                  <Button asChild variant="secondary">
                    <Link href={`/admin/comandas/${apt.orderId}`}>
                      <Receipt strokeWidth={1.75} aria-hidden />
                      Ver comanda
                    </Link>
                  </Button>
                )}
                {client && (
                  <Button asChild variant="secondary">
                    <a
                      href={whatsappLink(client.phone, reminder)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <MessageCircle strokeWidth={1.75} aria-hidden />
                      Enviar lembrete no WhatsApp
                    </a>
                  </Button>
                )}
                {(apt.status === "scheduled" || apt.status === "confirmed") && (
                  <div className="border-border flex flex-wrap gap-2 border-t pt-3">
                    <Button
                      variant="ghost"
                      disabled={busy}
                      onClick={() => change("no_show")}
                    >
                      <UserX strokeWidth={1.75} aria-hidden />
                      Marcar falta
                    </Button>
                    <Button
                      variant="ghost"
                      disabled={busy}
                      onClick={() => setConfirmCancel(true)}
                    >
                      <X strokeWidth={1.75} aria-hidden />
                      Cancelar agendamento
                    </Button>
                  </div>
                )}
                {client && (
                  <Link
                    href={`/admin/clientes/${client.id}`}
                    className="text-sm underline underline-offset-4"
                  >
                    Abrir ficha do cliente
                  </Link>
                )}
              </div>
            </div>

            <AlertDialog open={confirmCancel} onOpenChange={setConfirmCancel}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Cancelar o agendamento de {when.toLowerCase()},{" "}
                    {formatTime(apt.start)}?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    O horário fica livre e a lista de espera do dia é avisada.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Manter</AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    onClick={() => change("canceled")}
                  >
                    Cancelar agendamento
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
