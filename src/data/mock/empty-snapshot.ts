import type { DbSnapshot } from "@/domain/entities";

/** Snapshot mínimo válido (testes e base do seed). */
export function createEmptySnapshot(): DbSnapshot {
  return {
    version: 1,
    shop: {
      id: "shop-1",
      name: "Afiado",
      slug: "afiado",
      about: "",
      address: { street: "", number: "", district: "", city: "", state: "", zip: "" },
      phone: "",
      whatsapp: "",
      instagram: "",
      hours: [],
      closures: [],
      booking: {
        minAdvanceMinutes: 60,
        maxDaysAhead: 30,
        cancelDeadlineHours: 3,
        bufferMinutes: 0,
        slotStepMinutes: 15,
        allowAnyProfessional: true,
      },
      messages: { confirmation: "", reminder: "", missYou: "" },
    },
    professionals: [],
    timeOff: [],
    services: [],
    products: [],
    clients: [],
    appointments: [],
    waitlist: [],
    plans: [],
    subscriptions: [],
    charges: [],
    orders: [],
    cashSessions: [],
    cashMovements: [],
    commissions: [],
    reviews: [],
    session: { clientId: null, staffId: null, role: null },
  };
}
