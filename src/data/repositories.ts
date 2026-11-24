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
  ClientSource,
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

export class SlotTakenError extends Error {
  constructor() {
    super("Esse horário acabou de ser ocupado. Escolha outro horário.");
    this.name = "SlotTakenError";
  }
}

export class InvalidCodeError extends Error {
  constructor() {
    super("Código incorreto. Confira o código e tente de novo.");
    this.name = "InvalidCodeError";
  }
}

export type BookingRequest = {
  clientId: string;
  serviceIds: string[];
  /** null = qualquer barbeiro disponível no horário */
  professionalId: string | null;
  start: string;
  note: string;
  origin: "online" | "panel";
};

export type SignInRequest = {
  phone: string;
  code: string;
  /** Obrigatório no primeiro acesso. */
  profile?: { name: string; source?: ClientSource; marketingConsent: boolean };
};

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
    listByClient(clientId: string): Promise<Appointment[]>;
    /** Valida que o horário ainda está livre; lança SlotTakenError. */
    book(request: BookingRequest): Promise<Appointment>;
    reschedule(id: string, change: { start: string; professionalId: string | null }): Promise<Appointment>;
    /** Cancela e avisa a lista de espera do dia (RF-08). */
    cancel(id: string): Promise<Appointment>;
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
  auth: {
    /** V1: o código é simulado e devolvido para ser exibido na tela. */
    requestCode(phone: string): Promise<{ code: string; isNewClient: boolean }>;
    verifyCode(request: SignInRequest): Promise<Client>;
    signOut(): Promise<void>;
  };
  session: { get(): Promise<Session>; set(patch: Partial<Session>): Promise<Session> };
  demo: { reset(): Promise<void> };
};
