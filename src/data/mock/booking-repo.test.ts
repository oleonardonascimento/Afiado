import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  InvalidCodeError,
  SlotTakenError,
  type Repositories,
} from "@/data/repositories";
import { createEmptySnapshot } from "@/data/mock/empty-snapshot";
import { createMockRepositories } from "@/data/mock/repositories";
import { professionals, services, shop } from "@/data/mock/seed-catalog";
import { createStore } from "@/data/mock/store";

// "Agora" = quinta 26/11/2026 10h SP. Sexta 27/11 09:00 SP = 12:00Z.
const NOW = new Date("2026-11-26T13:00:00.000Z");
const FRI_9 = "2026-11-27T12:00:00.000Z";

let repos: Repositories;

beforeEach(() => {
  vi.useFakeTimers({ now: NOW, toFake: ["Date"] });
  const seed = () => {
    const db = createEmptySnapshot();
    db.shop = structuredClone(shop);
    db.professionals = structuredClone(professionals);
    db.services = structuredClone(services);
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
    db.waitlist.push({
      id: "wl-1",
      clientId: "cli-1",
      date: "2026-11-27",
      serviceIds: ["svc-1"],
      professionalId: null,
      createdAt: "2026-11-25T12:00:00.000Z",
      notifiedAt: null,
    });
    return db;
  };
  repos = createMockRepositories(
    createStore({ storage: null, seed, latency: [0, 0] }),
  );
});

afterEach(() => {
  vi.useRealTimers();
});

const request = {
  clientId: "cli-1",
  serviceIds: ["svc-1", "svc-3"],
  professionalId: "pro-3",
  start: FRI_9,
  note: "",
  origin: "online" as const,
};

describe("agendamento no mock", () => {
  it("book cria agendado com fim e preço somados", async () => {
    const apt = await repos.appointments.book(request);
    expect(apt.status).toBe("scheduled");
    expect(apt.end).toBe("2026-11-27T13:00:00.000Z");
    expect(apt.priceCents).toBe(8000);
    expect(await repos.appointments.listByClient("cli-1")).toHaveLength(1);
  });

  it("book recusa horário ocupado", async () => {
    await repos.appointments.book(request);
    await expect(repos.appointments.book(request)).rejects.toBeInstanceOf(
      SlotTakenError,
    );
  });

  it("qualquer disponível escolhe um barbeiro livre", async () => {
    await repos.appointments.book(request);
    const other = await repos.appointments.book({
      ...request,
      professionalId: null,
    });
    expect(other.professionalId).not.toBe("pro-3");
  });

  it("reschedule move o horário e mantém o id", async () => {
    const apt = await repos.appointments.book(request);
    const moved = await repos.appointments.reschedule(apt.id, {
      start: "2026-11-27T12:30:00.000Z",
      professionalId: "pro-3",
    });
    expect(moved.id).toBe(apt.id);
    expect(moved.end).toBe("2026-11-27T13:30:00.000Z");
  });

  it("cancel libera o horário e avisa a lista de espera do dia", async () => {
    const apt = await repos.appointments.book(request);
    const canceled = await repos.appointments.cancel(apt.id);
    expect(canceled.status).toBe("canceled");
    expect(canceled.canceledAt).not.toBeNull();
    expect((await repos.waitlist.get("wl-1"))?.notifiedAt).not.toBeNull();
    await expect(repos.appointments.book(request)).resolves.toBeTruthy();
  });
});

describe("auth no mock", () => {
  it("cliente existente entra com o código exibido", async () => {
    const { code, isNewClient } =
      await repos.auth.requestCode("(61) 99999-8888");
    expect(isNewClient).toBe(false);
    expect(code).toMatch(/^\d{4}$/);
    const client = await repos.auth.verifyCode({ phone: "61999998888", code });
    expect(client.id).toBe("cli-1");
    expect((await repos.session.get()).clientId).toBe("cli-1");
  });

  it("código errado é recusado", async () => {
    await repos.auth.requestCode("61999998888");
    await expect(
      repos.auth.verifyCode({ phone: "61999998888", code: "0000x" }),
    ).rejects.toBeInstanceOf(InvalidCodeError);
  });

  it("cliente novo é criado com o perfil", async () => {
    const { code, isNewClient } = await repos.auth.requestCode("61988887777");
    expect(isNewClient).toBe(true);
    const client = await repos.auth.verifyCode({
      phone: "61988887777",
      code,
      profile: {
        name: "Bruno Lima",
        source: "instagram",
        marketingConsent: true,
      },
    });
    expect(client.name).toBe("Bruno Lima");
    expect(client.source).toBe("instagram");
    await repos.auth.signOut();
    expect((await repos.session.get()).clientId).toBeNull();
  });
});
