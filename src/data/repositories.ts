/**
 * Interfaces assíncronas dos repositórios. Componentes nunca usam isto diretamente:
 * só hooks (TanStack Query) em features/*\/hooks ou hooks/. A V2 implementa as mesmas
 * interfaces chamando a API — os métodos aqui são a lista de endpoints do backend.
 */
import type {
  Appointment,
  Barbershop,
  CashMovement,
  CashSession,
  Charge,
  Client,
  Commission,
  Order,
  Plan,
  Product,
  Professional,
  Review,
  Service,
  Session,
  Subscription,
  TimeOff,
  WaitlistEntry,
} from "@/domain/entities";

export class NotFoundError extends Error {
  constructor(what: string) {
    super(`Não encontrado: ${what}`);
    this.name = "NotFoundError";
  }
}

export class MockNetworkError extends Error {
  constructor(message = "Não foi possível carregar. Verifique sua conexão.") {
    super(message);
    this.name = "MockNetworkError";
  }
}

export type Collection<T extends { id: string }, TCreate = Omit<T, "id">> = {
  list(): Promise<T[]>;
  get(id: string): Promise<T | null>;
  create(input: TCreate): Promise<T>;
  update(id: string, patch: Partial<Omit<T, "id">>): Promise<T>;
  remove(id: string): Promise<void>;
};

export type Repositories = {
  shop: { get(): Promise<Barbershop>; update(patch: Partial<Barbershop>): Promise<Barbershop> };
  professionals: Collection<Professional>;
  timeOff: Collection<TimeOff>;
  services: Collection<Service>;
  products: Collection<Product>;
  clients: Collection<Client> & { findByPhone(phone: string): Promise<Client | null> };
  appointments: Collection<Appointment> & {
    listByRange(fromIso: string, toIso: string, professionalId?: string): Promise<Appointment[]>;
  };
  waitlist: Collection<WaitlistEntry>;
  plans: Collection<Plan>;
  subscriptions: Collection<Subscription>;
  charges: Collection<Charge>;
  orders: Collection<Order>;
  cashSessions: Collection<CashSession>;
  cashMovements: Collection<CashMovement>;
  commissions: Collection<Commission>;
  reviews: Collection<Review>;
  session: { get(): Promise<Session>; set(patch: Partial<Session>): Promise<Session> };
  demo: { reset(): Promise<void> };
};
