import { describe, expect, it } from "vitest";
import { availableSlots, type AvailabilityInput } from "@/domain/availability";
import { professionals, services, shop } from "@/data/mock/seed-catalog";
import type { Appointment } from "@/domain/entities";

// Sexta 27/11/2026. "Agora" = quinta 26/11 às 10h em SP.
const NOW = new Date("2026-11-26T13:00:00.000Z");
const FRIDAY = "2026-11-27";

const base = (over: Partial<AvailabilityInput> = {}): AvailabilityInput => ({
  date: FRIDAY,
  serviceIds: ["svc-1"],
  professionalId: "pro-3",
  shop,
  professionals,
  services,
  appointments: [],
  timeOff: [],
  now: NOW,
  ...over,
});

const apt = (over: Partial<Appointment>): Appointment => ({
  id: "apt-x",
  clientId: "cli-1",
  professionalId: "pro-3",
  serviceIds: ["svc-1"],
  start: "2026-11-27T12:00:00.000Z",
  end: "2026-11-27T12:30:00.000Z",
  status: "scheduled",
  priceCents: 4500,
  note: "",
  origin: "online",
  createdAt: "2026-11-20T12:00:00.000Z",
  canceledAt: null,
  orderId: null,
  ...over,
});

const times = (slots: { start: string }[]) =>
  slots.map((s) => new Date(s.start).toISOString().slice(11, 16));

describe("availableSlots", () => {
  it("respeita o expediente do barbeiro com passo de 15 min", () => {
    const slots = availableSlots(base());
    // pro-3 sexta: 09:00–13:00 e 14:00–20:00 (SP = UTC-3)
    expect(times(slots)[0]).toBe("12:00"); // 09:00 SP
    expect(times(slots)).toContain("15:30"); // 12:30 SP (termina 13:00)
    expect(times(slots)).not.toContain("15:45"); // 12:45 SP passaria do almoço
    expect(times(slots)).toContain("17:00"); // 14:00 SP
    expect(times(slots).at(-1)).toBe("22:30"); // 19:30 SP
  });

  it("soma a duração de vários serviços", () => {
    const slots = availableSlots(base({ serviceIds: ["svc-1", "svc-3"] })); // 60 min
    expect(times(slots)).toContain("15:00"); // 12:00–13:00 SP
    expect(times(slots)).not.toContain("15:15");
  });

  it("pula horários ocupados e cancelados ficam livres", () => {
    const taken = apt({});
    const canceled = apt({ id: "apt-y", start: "2026-11-27T13:00:00.000Z", end: "2026-11-27T13:30:00.000Z", status: "canceled" });
    const slots = availableSlots(base({ appointments: [taken, canceled] }));
    expect(times(slots)).not.toContain("12:00");
    expect(times(slots)).not.toContain("11:45");
    expect(times(slots)).toContain("12:30");
    expect(times(slots)).toContain("13:00");
  });

  it("aplica o intervalo entre atendimentos", () => {
    const slots = availableSlots(
      base({ appointments: [apt({})], shop: { ...shop, booking: { ...shop.booking, bufferMinutes: 15 } } }),
    );
    expect(times(slots)).not.toContain("12:30");
    expect(times(slots)).toContain("12:45");
  });

  it("pula bloqueios e folgas", () => {
    const slots = availableSlots(
      base({
        timeOff: [
          { id: "off", professionalId: "pro-3", start: "2026-11-27T17:00:00.000Z", end: "2026-11-27T18:00:00.000Z", kind: "block", reason: "" },
        ],
      }),
    );
    expect(times(slots)).not.toContain("17:00");
    expect(times(slots)).not.toContain("17:30");
    expect(times(slots)).toContain("18:00");
  });

  it("respeita a antecedência mínima", () => {
    const now = new Date("2026-11-27T13:10:00.000Z"); // 10:10 SP, antecedência 60 min
    expect(times(availableSlots(base({ now })))[0]).toBe("14:15");
  });

  it("não abre dia fechado, passado, fechamento ou além da janela", () => {
    expect(availableSlots(base({ date: "2026-11-29" }))).toEqual([]); // domingo
    expect(availableSlots(base({ date: "2026-11-25" }))).toEqual([]); // passado
    expect(availableSlots(base({ shop: { ...shop, closures: [{ date: FRIDAY, reason: "Feriado" }] } }))).toEqual([]);
    expect(availableSlots(base({ date: "2027-01-08" }))).toEqual([]); // > 30 dias
  });

  it("barbeiro que não faz o serviço não tem horários", () => {
    expect(availableSlots(base({ professionalId: "pro-4", serviceIds: ["svc-11"] }))).toEqual([]);
  });

  it("qualquer disponível junta os horários e escolhe um barbeiro livre", () => {
    const all = availableSlots(base({ professionalId: null }));
    const starts = all.map((s) => s.start);
    expect(new Set(starts).size).toBe(starts.length);
    expect(times(all)[0]).toBe("12:00"); // 09:00 SP (pro-2 e pro-3)
    const blocked = availableSlots(
      base({ professionalId: null, appointments: [apt({ professionalId: "pro-3" })] }),
    );
    expect(blocked.find((s) => times([s])[0] === "12:00")?.professionalId).toBe("pro-2");
  });

  it("ignora o próprio agendamento ao remarcar", () => {
    const own = apt({ id: "apt-own" });
    expect(times(availableSlots(base({ appointments: [own], ignoreAppointmentId: "apt-own" })))).toContain("12:00");
  });
});
