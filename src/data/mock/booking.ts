/** Agendar, remarcar e cancelar no mock — a V2 faz o mesmo no servidor. */
import {
  NotFoundError,
  OperationError,
  SlotTakenError,
  type BookingRequest,
} from "@/data/repositories";
import type { MockStore } from "@/data/mock/store";
import { availableSlots, type Slot } from "@/domain/availability";
import type { Appointment, DbSnapshot } from "@/domain/entities";
import { dateOf } from "@/lib/calendar";

function findSlot(
  db: DbSnapshot,
  serviceIds: string[],
  professionalId: string | null,
  start: string,
  ignoreAppointmentId?: string,
): Slot {
  const slots = availableSlots({
    date: dateOf(start),
    serviceIds,
    professionalId,
    shop: db.shop,
    professionals: db.professionals,
    services: db.services,
    appointments: db.appointments,
    timeOff: db.timeOff,
    now: new Date(),
    ignoreAppointmentId,
  });
  const slot = slots.find((s) => Date.parse(s.start) === Date.parse(start));
  if (!slot) throw new SlotTakenError();
  return slot;
}

/** Encaixe: usa o horário pedido sem checar conflitos (o painel avisa antes). */
function fitInSlot(db: DbSnapshot, request: BookingRequest): Slot {
  if (!request.professionalId)
    throw new OperationError("Escolha o barbeiro do encaixe.");
  const minutes = request.serviceIds.reduce(
    (sum, id) =>
      sum + (db.services.find((s) => s.id === id)?.durationMinutes ?? 0),
    0,
  );
  const start = new Date(request.start);
  return {
    start: start.toISOString(),
    end: new Date(start.getTime() + minutes * 60_000).toISOString(),
    professionalId: request.professionalId,
  };
}

export function bookAppointment(
  store: MockStore,
  request: BookingRequest,
): Appointment {
  const db = store.read();
  const slot = request.allowOverlap
    ? fitInSlot(db, request)
    : findSlot(db, request.serviceIds, request.professionalId, request.start);
  const appointment: Appointment = {
    id: crypto.randomUUID(),
    clientId: request.clientId,
    professionalId: slot.professionalId,
    serviceIds: [...request.serviceIds],
    start: slot.start,
    end: slot.end,
    status: "scheduled",
    priceCents: request.serviceIds.reduce(
      (sum, id) =>
        sum + (db.services.find((s) => s.id === id)?.priceCents ?? 0),
      0,
    ),
    note: request.note.trim(),
    origin: request.origin,
    createdAt: new Date().toISOString(),
    canceledAt: null,
    orderId: null,
  };
  store.write((d) => {
    d.appointments.push(appointment);
  });
  return appointment;
}

export function rescheduleAppointment(
  store: MockStore,
  id: string,
  change: { start: string; professionalId: string | null },
): Appointment {
  const db = store.read();
  const current = db.appointments.find((a) => a.id === id);
  if (!current) throw new NotFoundError(`appointments/${id}`);
  const slot = findSlot(
    db,
    current.serviceIds,
    change.professionalId,
    change.start,
    id,
  );
  let updated = current;
  store.write((d) => {
    const target = d.appointments.find((a) => a.id === id);
    if (!target) return;
    target.start = slot.start;
    target.end = slot.end;
    target.professionalId = slot.professionalId;
    target.status = "scheduled";
    updated = target;
  });
  return updated;
}

export function cancelAppointment(store: MockStore, id: string): Appointment {
  let updated: Appointment | undefined;
  const now = new Date().toISOString();
  store.write((d) => {
    const target = d.appointments.find((a) => a.id === id);
    if (!target) return;
    target.status = "canceled";
    target.canceledAt = now;
    updated = target;
    const day = dateOf(target.start);
    for (const entry of d.waitlist) {
      if (entry.date === day && entry.notifiedAt === null)
        entry.notifiedAt = now;
    }
  });
  if (!updated) throw new NotFoundError(`appointments/${id}`);
  return updated;
}
