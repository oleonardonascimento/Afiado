/**
 * Login do cliente por telefone + código (RF-05). Na V1 o código é gerado aqui
 * e devolvido para a tela exibir; na V2 vai por SMS/WhatsApp.
 */
import { InvalidCodeError, type SignInRequest } from "@/data/repositories";
import type { MockStore } from "@/data/mock/store";
import { ClientInputSchema, type Client } from "@/domain/entities";
import { normalizePhone } from "@/domain/phone";

export function createMockAuth(store: MockStore) {
  const pending = new Map<string, string>();

  return {
    requestCode(phone: string) {
      const digits = normalizePhone(phone);
      const code = String(1000 + Math.floor(Math.random() * 9000));
      pending.set(digits, code);
      const isNewClient = !store.read().clients.some((c) => c.phone === digits);
      return { code, isNewClient };
    },

    verifyCode({ phone, code, profile }: SignInRequest): Client {
      const digits = normalizePhone(phone);
      if (pending.get(digits) !== code.trim()) throw new InvalidCodeError();
      pending.delete(digits);
      let client = store.read().clients.find((c) => c.phone === digits);
      if (!client) {
        const input = ClientInputSchema.parse({ ...profile, phone: digits });
        const created: Client = {
          id: crypto.randomUUID(),
          name: input.name,
          phone: input.phone,
          email: null,
          birthday: null,
          source: input.source ?? null,
          notes: "",
          tags: [],
          marketingConsent: input.marketingConsent,
          createdAt: new Date().toISOString(),
        };
        store.write((db) => {
          db.clients.push(created);
        });
        client = created;
      }
      const clientId = client.id;
      store.write((db) => {
        db.session.clientId = clientId;
      });
      return client;
    },

    signOut() {
      store.write((db) => {
        db.session.clientId = null;
      });
    },
  };
}
