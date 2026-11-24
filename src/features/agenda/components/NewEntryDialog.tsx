"use client";

/** Novo agendamento (com opção de encaixe) ou bloqueio de horário, aberto pela agenda. */
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SlotTakenError } from "@/data/repositories";
import type { Client, Professional } from "@/domain/entities";
import { useCreateTimeOff, usePanelBooking } from "@/features/agenda/hooks/useAgenda";
import { useServices } from "@/features/catalog/hooks/useCatalog";
import { ClientPicker } from "@/features/clients/components/ClientPicker";
import { atTime, fromMinutes, toMinutes } from "@/lib/calendar";
import { formatBRL } from "@/lib/format";
import { durationLabel } from "@/lib/labels";

export type NewEntryDraft = {
  date: string;
  time: string | null;
  professionalId: string | null;
  mode: "appointment" | "block";
};

type NewEntryDialogProps = { draft: NewEntryDraft; team: Professional[]; onClose: () => void };

export function NewEntryDialog({ draft, team, onClose }: NewEntryDialogProps) {
  const services = useServices();
  const book = usePanelBooking();
  const createBlock = useCreateTimeOff();
  const [mode, setMode] = useState(draft.mode);
  const [client, setClient] = useState<Client | null>(null);
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [professionalId, setProfessionalId] = useState(draft.professionalId ?? team[0]?.id ?? "");
  const [date, setDate] = useState(draft.date);
  const [time, setTime] = useState(draft.time ?? "09:00");
  const [endTime, setEndTime] = useState(draft.time ? addMinutes(draft.time, 60) : "10:00");
  const [fitIn, setFitIn] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const pro = team.find((p) => p.id === professionalId);
  const available = (services.data ?? []).filter((s) => s.active && pro?.serviceIds.includes(s.id));

  const submitAppointment = () => {
    setError(null);
    if (!client) return setError("Escolha ou cadastre o cliente.");
    if (serviceIds.length === 0) return setError("Escolha pelo menos um serviço.");
    book.mutate(
      {
        clientId: client.id,
        serviceIds,
        professionalId,
        start: atTime(date, time),
        note: "",
        allowOverlap: fitIn,
      },
      {
        onSuccess: () => {
          toast.success(fitIn ? "Encaixe criado" : "Agendamento criado");
          onClose();
        },
        onError: (e) =>
          setError(
            e instanceof SlotTakenError
              ? "Esse horário não está livre para este barbeiro. Escolha outro ou marque como encaixe."
              : "Não foi possível criar. Tente de novo.",
          ),
      },
    );
  };

  const submitBlock = () => {
    setError(null);
    if (toMinutes(endTime) <= toMinutes(time)) return setError("O fim do bloqueio precisa ser depois do início.");
    createBlock.mutate(
      {
        professionalId,
        start: atTime(date, time),
        end: atTime(date, endTime),
        kind: "block",
        reason: reason.trim(),
      },
      {
        onSuccess: () => {
          toast.success("Horário bloqueado");
          onClose();
        },
        onError: () => setError("Não foi possível bloquear. Tente de novo."),
      },
    );
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-dvh overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo na agenda</DialogTitle>
          <DialogDescription>Crie um agendamento, um encaixe ou bloqueie um horário.</DialogDescription>
        </DialogHeader>
        <Tabs value={mode} onValueChange={(v) => setMode(v === "block" ? "block" : "appointment")}>
          <TabsList>
            <TabsTrigger value="appointment">Agendamento</TabsTrigger>
            <TabsTrigger value="block">Bloqueio</TabsTrigger>
          </TabsList>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="entry-pro">Barbeiro</Label>
              <Select value={professionalId} onValueChange={(v) => {
                setProfessionalId(v);
                setServiceIds([]);
              }}>
                <SelectTrigger id="entry-pro">
                  <SelectValue placeholder="Escolha o barbeiro" />
                </SelectTrigger>
                <SelectContent>
                  {team.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="entry-date">Data</Label>
              <Input id="entry-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="entry-time">Início</Label>
              <Input id="entry-time" type="time" step={900} value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>

          <TabsContent value="appointment" className="mt-4 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="entry-client">Cliente</Label>
              <ClientPicker id="entry-client" value={client} onChange={setClient} />
            </div>
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1 text-sm font-medium">Serviços</legend>
              {available.length === 0 && <p className="text-sm text-text-muted">Escolha um barbeiro.</p>}
              {available.map((s) => {
                const checked = serviceIds.includes(s.id);
                return (
                  <label key={s.id} className="flex min-h-11 items-center gap-3 text-sm">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(v) =>
                        setServiceIds((ids) => (v ? [...ids, s.id] : ids.filter((id) => id !== s.id)))
                      }
                    />
                    <span className="flex-1">
                      {s.name} <span className="text-text-muted">· {durationLabel(s.durationMinutes)}</span>
                    </span>
                    <span className="tabular-nums">{formatBRL(s.priceCents)}</span>
                  </label>
                );
              })}
            </fieldset>
            <label className="flex items-start gap-3 text-sm">
              <Checkbox checked={fitIn} onCheckedChange={(v) => setFitIn(v === true)} className="mt-0.5" />
              <span>
                <span className="font-medium">É um encaixe</span>
                <span className="block text-text-muted">Permite marcar mesmo se o horário estiver ocupado.</span>
              </span>
            </label>
          </TabsContent>

          <TabsContent value="block" className="mt-4 flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="entry-end">Fim</Label>
              <Input id="entry-end" type="time" step={900} value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="entry-reason">Motivo (opcional)</Label>
              <Input id="entry-reason" value={reason} maxLength={80} onChange={(e) => setReason(e.target.value)} />
            </div>
          </TabsContent>
        </Tabs>

        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Voltar
          </Button>
          {mode === "appointment" ? (
            <Button loading={book.isPending} onClick={submitAppointment}>
              {fitIn ? "Criar encaixe" : "Criar agendamento"}
            </Button>
          ) : (
            <Button loading={createBlock.isPending} onClick={submitBlock}>
              Bloquear horário
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function addMinutes(hhmm: string, minutes: number): string {
  return fromMinutes(Math.min(23 * 60 + 45, toMinutes(hhmm) + minutes));
}
