import {
  NotFoundError,
  type Collection,
  type Repositories,
} from "@/data/repositories";
import { createMockAuth } from "@/data/mock/auth";
import {
  bookAppointment,
  cancelAppointment,
  rescheduleAppointment,
} from "@/data/mock/booking";
import {
  addCashMovement,
  cancelOrder,
  cancelSubscription,
  closeCash,
  closeOrder,
  markCommissionsPaid,
  openCash,
  openOrderFromAppointment,
  openWalkInOrder,
  subscribe,
} from "@/data/mock/operations";
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
  const orders = collection("orders");
  const subscriptions = collection("subscriptions");
  const commissions = collection("commissions");
  /** Espera a latência e devolve uma cópia do resultado da operação. */
  const run = async <T>(fn: () => T): Promise<T> => {
    await store.delay();
    return clone(fn());
  };

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
        return clone(
          store.read().clients.find((c) => c.phone === digits) ?? null,
        );
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
        return clone(
          store.read().appointments.filter((a) => a.clientId === clientId),
        );
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
    subscriptions: {
      ...subscriptions,
      subscribe: (input) => run(() => subscribe(store, input)),
      cancel: (id) => run(() => cancelSubscription(store, id)),
    },
    charges: collection("charges"),
    orders: {
      ...orders,
      openFromAppointment: (id) =>
        run(() => openOrderFromAppointment(store, id)),
      openWalkIn: ({ clientId, professionalId }) =>
        run(() => openWalkInOrder(store, clientId, professionalId)),
      close: (id, payments) => run(() => closeOrder(store, id, payments)),
      cancel: (id) => run(() => cancelOrder(store, id)),
    },
    cash: {
      open: (openingCents, staffId) =>
        run(() => openCash(store, openingCents, staffId)),
      addMovement: (input) => run(() => addCashMovement(store, input)),
      close: (id, counted, note) =>
        run(() => closeCash(store, id, counted, note)),
    },
    cashSessions: collection("cashSessions"),
    cashMovements: collection("cashMovements"),
    commissions: {
      ...commissions,
      markPaid: (ids) => run(() => markCommissionsPaid(store, ids)),
    },
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
