/**
 * Query keys do TanStack Query. Ficam juntas porque os mesmos dados (agenda,
 * comandas, clientes) são lidos pela página pública e pelo painel.
 */
export const sessionKeys = {
  all: ["session"] as const,
};

export const catalogKeys = {
  shop: ["shop"] as const,
  services: ["services"] as const,
  professionals: ["professionals"] as const,
  products: ["products"] as const,
  plans: ["plans"] as const,
  timeOff: ["timeOff"] as const,
};

export const reviewKeys = {
  all: ["reviews"] as const,
};

export const appointmentKeys = {
  all: ["appointments"] as const,
  range: (from: string, to: string) =>
    ["appointments", "range", from, to] as const,
  client: (clientId: string) => ["appointments", "client", clientId] as const,
  detail: (id: string) => ["appointments", "detail", id] as const,
};

export const clientKeys = {
  all: ["clients"] as const,
  detail: (id: string) => ["clients", "detail", id] as const,
};

export const waitlistKeys = {
  all: ["waitlist"] as const,
};

export const clubKeys = {
  subscriptions: ["subscriptions"] as const,
  charges: ["charges"] as const,
};

export const orderKeys = {
  all: ["orders"] as const,
  detail: (id: string) => ["orders", "detail", id] as const,
};

export const cashKeys = {
  sessions: ["cashSessions"] as const,
  movements: ["cashMovements"] as const,
};

export const commissionKeys = {
  all: ["commissions"] as const,
};
