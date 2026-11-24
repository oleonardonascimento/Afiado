import { beforeEach, describe, expect, it } from "vitest";
import { NotFoundError, type Repositories } from "@/data/repositories";
import { createEmptySnapshot } from "@/data/mock/empty-snapshot";
import { createMockRepositories } from "@/data/mock/repositories";
import { createStore } from "@/data/mock/store";
import type { Appointment, DbSnapshot } from "@/domain/entities";

const appointment = (over: Partial<Appointment>): Appointment => ({
  id: "apt-x",
  clientId: "cli-1",
  professionalId: "pro-1",
  serviceIds: ["svc-1"],
  start: "2026-11-27T13:00:00.000Z",
  end: "2026-11-27T13:30:00.000Z",
  status: "scheduled",
  priceCents: 4500,
  note: "",
  origin: "online",
  createdAt: "2026-11-20T13:00:00.000Z",
  canceledAt: null,
  orderId: null,
  ...over,
});

function seedWithData(): DbSnapshot {
  const db = createEmptySnapshot();
  db.clients.push({
    id: "cli-1",
    name: "Ana Souza",
    phone: "61999998888",
    email: null,
    birthday: null,
    source: null,
    notes: "",
    tags: [],
    marketingConsent: false,
    createdAt: "2026-01-01T12:00:00.000Z",
  });
  db.appointments.push(
    appointment({ id: "apt-1", start: "2026-11-27T11:45:00.000Z", end: "2026-11-27T12:15:00.000Z" }),
    appointment({ id: "apt-2", start: "2026-11-27T14:00:00.000Z", end: "2026-11-27T14:30:00.000Z" }),
    appointment({ id: "apt-3", professionalId: "pro-2" }),
  );
  return db;
}

let repos: Repositories;

beforeEach(() => {
  repos = createMockRepositories(createStore({ storage: null, seed: seedWithData, latency: [0, 0] }));
});

describe("mock repositories", () => {
  it("create gera id único e list inclui", async () => {
    const input = {
      name: "Corte",
      category: "corte" as const,
      priceCents: 4500,
      durationMinutes: 30,
      commissionPct: 40,
      onlineBooking: true,
      active: true,
    };
    const a = await repos.services.create(input);
    const b = await repos.services.create(input);
    expect(a.id).not.toBe(b.id);
    expect((await repos.services.list()).map((s) => s.id)).toEqual([a.id, b.id]);
  });

  it("update de id inexistente rejeita com NotFoundError", async () => {
    await expect(repos.services.update("nao-existe", { name: "X" })).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it("findByPhone normaliza antes de buscar", async () => {
    expect((await repos.clients.findByPhone("(61) 99999-8888"))?.id).toBe("cli-1");
    expect(await repos.clients.findByPhone("61 98888-7777")).toBeNull();
  });

  it("listByRange pega sobreposição e filtra por profissional", async () => {
    const from = "2026-11-27T12:00:00.000Z";
    const to = "2026-11-27T14:00:00.000Z";
    const all = await repos.appointments.listByRange(from, to);
    expect(all.map((a) => a.id).sort()).toEqual(["apt-1", "apt-3"]);
    const pro1 = await repos.appointments.listByRange(from, to, "pro-1");
    expect(pro1.map((a) => a.id)).toEqual(["apt-1"]);
  });

  it("retorna cópias", async () => {
    const client = await repos.clients.get("cli-1");
    if (!client) throw new Error("esperava cliente");
    client.name = "Mutado";
    expect((await repos.clients.get("cli-1"))?.name).toBe("Ana Souza");
  });

  it("session e reset", async () => {
    await repos.session.set({ role: "barber" });
    expect((await repos.session.get()).role).toBe("barber");
    await repos.demo.reset();
    expect((await repos.session.get()).role).toBeNull();
  });
});
