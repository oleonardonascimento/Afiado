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
  Payment,
  PaymentMethod,
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

/** Operação recusada por regra de negócio; a mensagem já é o texto para o usuário. */
export class OperationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OperationError";
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
  /** Encaixe do painel: ignora a checagem de horário livre (exige barbeiro). */
  allowOverlap?: boolean;
};

export type NewMovement = {
  kind: "income" | "expense" | "withdrawal";
  method: PaymentMethod;
  amountCents: number;
  description: string;
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
  subscriptions: Collection<Subscription> & {
    /** Simula a 1ª cobrança aprovada. Recusa se o cliente já tem assinatura vigente. */
    subscribe(input: { clientId: string; planId: string; paymentMethod: "pix" | "card" }): Promise<Subscription>;
    /** Benefício continua até o fim do período pago (status "canceling"). */
    cancel(id: string): Promise<Subscription>;
  };
  charges: Collection<Charge>;
  orders: Collection<Order> & {
    /** Conclui o atendimento e abre (ou devolve) a comanda dele, já com o benefício do Clube. */
    openFromAppointment(appointmentId: string): Promise<Order>;
    /** Comanda avulsa (sem agendamento). */
    openWalkIn(input: { clientId: string | null; professionalId: string }): Promise<Order>;
    /** Valida, registra no caixa aberto, gera comissões e baixa estoque. */
    close(id: string, payments: Payment[]): Promise<Order>;
    cancel(id: string): Promise<Order>;
  };
  cash: {
    open(openingCents: number, staffId: string): Promise<CashSession>;
    addMovement(input: NewMovement): Promise<CashMovement>;
    close(id: string, counted: Record<PaymentMethod, number>, note: string): Promise<CashSession>;
  };
  cashSessions: Collection<CashSession>;
  cashMovements: Collection<CashMovement>;
  commissions: Collection<Commission> & { markPaid(ids: string[]): Promise<void> };
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
