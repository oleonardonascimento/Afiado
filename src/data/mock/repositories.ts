import { NotFoundError, type Collection, type Repositories } from "@/data/repositories";
import { createMockAuth } from "@/data/mock/auth";
import { bookAppointment, cancelAppointment, rescheduleAppointment } from "@/data/mock/booking";
import type { MockStore } from "@/data/mock/store";
import type { DbSnapshot } from "@/domain/entities";
import { normalizePhone } from "@/domain/phone";

type CollectionKey = {
  [K in keyof DbSnapshot]: DbSnapshot[K] extends { id: string }[] ? K : never;
}[keyof DbSnapshot];

type Item<K extends CollectionKey> = DbSnapshot[K][number];

const clone = <T>(value: T): T => structuredClone(value);

export function createMockRepositories(store: MockStore): Repositories {
  function collection<K extends CollectionKey>(key: K): Collection<Item<K>> {
    const items = () => store.read()[key] as Item<K>[];
    return {
      async list() {
        await store.delay();
        return clone(items());
      },
      async get(id) {
        await store.delay();
        return clone(items().find((i) => i.id === id) ?? null);
      },
      async create(input) {
        await store.delay();
        const created = { ...clone(input), id: crypto.randomUUID() } as Item<K>;
        store.write((db) => {
          (db[key] as Item<K>[]).push(created);
        });
        return clone(created);
      },
      async update(id, patch) {
        await store.delay();
        let updated: Item<K> | undefined;
        store.write((db) => {
          const list = db[key] as Item<K>[];
          const index = list.findIndex((i) => i.id === id);
          if (index === -1) return;
          updated = { ...list[index], ...clone(patch), id } as Item<K>;
          list[index] = updated;
        });
        if (!updated) throw new NotFoundError(`${key}/${id}`);
        return clone(updated);
      },
      async remove(id) {
        await store.delay();
        store.write((db) => {
          const list = db[key] as Item<K>[];
          const index = list.findIndex((i) => i.id === id);
          if (index !== -1) list.splice(index, 1);
        });
      },
    };
  }

  const clients = collection("clients");
  const appointments = collection("appointments");
  const auth = createMockAuth(store);

  return {
    shop: {
      async get() {
        await store.delay();
        return clone(store.read().shop);
      },
      async update(patch) {
        await store.delay();
        store.write((db) => {
          db.shop = { ...db.shop, ...clone(patch) };
        });
        return clone(store.read().shop);
      },
    },
    professionals: collection("professionals"),
    timeOff: collection("timeOff"),
    services: collection("services"),
    products: collection("products"),
    clients: {
      ...clients,
      async findByPhone(phone) {
        await store.delay();
        const digits = normalizePhone(phone);
        return clone(store.read().clients.find((c) => c.phone === digits) ?? null);
      },
    },
    appointments: {
      ...appointments,
      async listByRange(fromIso, toIso, professionalId) {
        await store.delay();
        const from = Date.parse(fromIso);
        const to = Date.parse(toIso);
        return clone(
          store
            .read()
            .appointments.filter(
              (a) =>
                Date.parse(a.start) < to &&
                Date.parse(a.end) > from &&
                (!professionalId || a.professionalId === professionalId),
            ),
        );
      },
      async listByClient(clientId) {
        await store.delay();
        return clone(store.read().appointments.filter((a) => a.clientId === clientId));
      },
      async book(request) {
        await store.delay();
        return clone(bookAppointment(store, request));
      },
      async reschedule(id, change) {
        await store.delay();
        return clone(rescheduleAppointment(store, id, change));
      },
      async cancel(id) {
        await store.delay();
        return clone(cancelAppointment(store, id));
      },
    },
    waitlist: collection("waitlist"),
    plans: collection("plans"),
    subscriptions: collection("subscriptions"),
    charges: collection("charges"),
    orders: collection("orders"),
    cashSessions: collection("cashSessions"),
    cashMovements: collection("cashMovements"),
    commissions: collection("commissions"),
    reviews: collection("reviews"),
    auth: {
      async requestCode(phone) {
        await store.delay();
        return auth.requestCode(phone);
      },
      async verifyCode(request) {
        await store.delay();
        return clone(auth.verifyCode(request));
      },
      async signOut() {
        await store.delay();
        auth.signOut();
      },
    },
    session: {
      async get() {
        await store.delay();
        return clone(store.read().session);
      },
      async set(patch) {
        await store.delay();
        store.write((db) => {
          db.session = { ...db.session, ...patch };
        });
        return clone(store.read().session);
      },
    },
    demo: {
      async reset() {
        await store.delay();
        store.reset();
      },
    },
  };
}
