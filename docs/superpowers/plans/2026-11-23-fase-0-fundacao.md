# Fase 0 · Fundação — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Projeto Next.js rodando com tokens de design, fontes, tema claro/escuro, tipos e schemas do domínio, camada de repositórios mock com seed determinístico e os dois layouts (público e painel) navegáveis.

**Architecture:** Componente → hook (TanStack Query) → interface de repositório (`data/repositories.ts`) → implementação mock (`data/mock/`) sobre um snapshot único em `localStorage`. Regras e tipos puros em `domain/`. Fases 1–5 têm planos próprios, escritos no início de cada fase sobre as interfaces que esta fase produzir.

**Tech Stack:** Next.js (App Router, última estável) · TypeScript strict · Tailwind v4 · shadcn/ui · TanStack Query · RHF + Zod · Zustand · date-fns + date-fns-tz · Lucide · Vitest + Testing Library · Playwright.

**Spec:** [design](../specs/2026-11-23-afiado-v1-design.md) · [PRD](../../PRD-v1.md) · [CLAUDE.md](../../../CLAUDE.md)

## Global Constraints

- Dinheiro sempre em **centavos inteiros** (`number`); datas guardadas como **ISO string**; fuso `America/Sao_Paulo`; locale `ptBR`.
- Telefone armazenado só com dígitos (10 ou 11 dígitos, sem +55).
- Nenhum componente importa de `data/mock/`; `localStorage` só é acessado em `data/mock/`.
- Só tokens (PRD §8.2): nada de hex, `text-[13px]`, `p-[7px]` ou sombra avulsa fora de `src/styles/globals.css`.
- Fontes: Big Shoulders Display 800–900 (display) e Instrument Sans (texto), via `next/font/google`. Sem mono.
- Raios: 6px controles, 10px cards, 999px avatar/selo. Ícones Lucide `strokeWidth={1.75}`.
- Código em inglês; interface em pt-BR; arquivos `PascalCase.tsx` / `useAlgo.ts` / `kebab-case.ts`; imports `@/`.
- Nenhuma dependência fora da lista da stack (Prettier e `@testing-library/*`, `jsdom` são ferramentas de teste/qualidade já previstas no PRD RNF-12).
- Commits em pt-BR no imperativo, terminando com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Snapshot corrompido ou de versão antiga no `localStorage`** → o mock descarta e regenera o seed, sem tela branca. (Teste na Task 4.)
2. **`localStorage` indisponível/cheio (modo privado, quota)** → mock segue em memória, sem lançar. (Teste na Task 4.)
3. **Telefone com máscara, espaços ou +55** → `normalizePhone` devolve só os dígitos nacionais; inválido falha no schema com mensagem pt-BR. (Teste na Task 3.)
4. **Seed gerado perto da meia-noite / em outro fuso do navegador** → datas do seed calculadas no fuso de São Paulo, nenhum agendamento cai fora do expediente. (Teste na Task 5.)
5. **Tema escuro forçado pelo sistema** → todos os tokens têm valor no `.dark`; nenhum texto some. (Verificação visual na Task 6.)

---

## Estrutura de arquivos desta fase

```
package.json, tsconfig.json, next.config.ts, eslint.config.mjs, .prettierrc,
vitest.config.ts, vitest.setup.ts, playwright.config.ts, components.json, .gitignore
src/styles/globals.css                 tokens (claro/escuro) + @theme do Tailwind
src/app/layout.tsx                     fontes, <html lang="pt-BR">, Providers
src/app/providers.tsx                  QueryClientProvider + tema (client)
src/app/(public)/layout.tsx            cabeçalho/rodapé públicos
src/app/(public)/page.tsx              home provisória (vira C1 na Fase 1)
src/app/admin/layout.tsx               shell do painel
src/app/admin/page.tsx                 dashboard provisório
src/components/ui/*                    button, input, label, badge, skeleton, card, dialog, sheet, dropdown-menu, select, tabs, sonner
src/components/shared/Logo.tsx         nome + selo listrado
src/components/shared/PoleStripe.tsx   listra do poste (respeita reduced-motion)
src/components/shared/ThemeToggle.tsx
src/features/admin-shell/components/AdminSidebar.tsx, AdminBottomNav.tsx, RoleSwitcher.tsx
src/features/admin-shell/hooks/useSession.ts
src/features/demo/hooks/useResetDemo.ts
src/domain/entities.ts                 tipos + schemas Zod
src/domain/phone.ts                    normalizePhone, isValidPhone
src/lib/format.ts                      formatBRL, formatDate, formatTime, formatPhone
src/lib/cn.ts
src/lib/random.ts                      PRNG determinístico
src/data/repositories.ts               interfaces
src/data/mock/store.ts                 snapshot + persistência + latência + erro
src/data/mock/seed.ts                  generateSeed(now)
src/data/mock/repositories.ts          implementação mock
src/data/index.ts                      exporta `repos`
src/hooks/useMediaQuery.ts
tests: ao lado do arquivo (`*.test.ts`) ; e2e/ para Playwright
```

---

### Task 1: Scaffold do projeto e ferramentas

**Files:** Create: os arquivos de configuração da raiz, `src/app/layout.tsx`, `src/app/(public)/page.tsx`, `e2e/smoke.spec.ts`.

**Interfaces:** Produces: scripts `dev`, `build`, `lint`, `typecheck`, `test`, `test:e2e`, `format`.

- [ ] **Step 1:** Criar o app com `npx create-next-app@latest` (TS, ESLint, Tailwind, App Router, `src/`, alias `@/*`, sem Turbopack-only flags) **numa pasta temporária no scratchpad** (a raiz já tem `docs/` e `CLAUDE.md`) e mover o conteúdo para a raiz sem sobrescrever `docs/` e `CLAUDE.md`. Mover `app/page.tsx` para `app/(public)/page.tsx`.
- [ ] **Step 2:** `tsconfig.json` com `"strict": true` e `"noUncheckedIndexedAccess": true`. Script `"typecheck": "tsc --noEmit"`.
- [ ] **Step 3:** Instalar `@tanstack/react-query zustand react-hook-form @hookform/resolvers zod date-fns date-fns-tz lucide-react recharts` e dev `vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @playwright/test prettier prettier-plugin-tailwindcss vite-tsconfig-paths`.
- [ ] **Step 4:** `vitest.config.ts` (jsdom, `vitest.setup.ts` com jest-dom, tsconfig paths, `include: ["src/**/*.test.{ts,tsx}"]`); `playwright.config.ts` (`webServer: npm run build && npm run start`, porta 3000, projetos `desktop` 1280×800 e `mobile` 375×812, testDir `e2e`).
- [ ] **Step 5:** `npx shadcn@latest init` (estilo new-york, base neutra, CSS vars) e adicionar `button input label badge skeleton card dialog sheet dropdown-menu select tabs sonner`.
- [ ] **Step 6:** Escrever `e2e/smoke.spec.ts`: `test("home abre", ...)` → `expect(page).toHaveTitle(/Afiado/)`.
- [ ] **Step 7:** Rodar `npm run typecheck && npm run lint && npm run test -- --passWithNoTests && npm run build`. Expected: tudo verde. Rodar `npx playwright install chromium && npm run test:e2e` → smoke passa (depois de definir `metadata.title = "Afiado"`).
- [ ] **Step 8:** Commit `cria projeto Next com ferramentas de teste e shadcn`.

### Task 2: Tokens, fontes, tema e formatação

**Files:** Modify `src/styles/globals.css` (mover de `app/globals.css`), `src/app/layout.tsx`, `src/components/ui/button.tsx`; Create `src/app/providers.tsx`, `src/lib/format.ts`, `src/lib/format.test.ts`, `src/components/shared/{Logo,PoleStripe,ThemeToggle}.tsx`.

**Interfaces:**
- Produces: `formatBRL(cents: number): string` · `formatDate(iso: string, pattern?: string): string` (padrão `"dd/MM"`) · `formatTime(iso: string): string` (`"HH:mm"`) · `formatWeekday(iso: string): string` (`"sexta"`) · `formatPhone(digits: string): string` · `toZoned(iso: string): Date` · `TZ = "America/Sao_Paulo"`.
- Produces: classes Tailwind `bg-bg bg-surface bg-surface-2 border-border border-border-strong text-text text-text-muted bg-primary text-primary-fg bg-brand text-brand-fg bg-club text-club-fg text-success text-warning text-danger text-info ring-focus font-display font-sans rounded-control rounded-card`.
- Produces: `<Logo size="sm"|"md"|"lg" />`, `<PoleStripe className? animated? />`, `<ThemeToggle />`.

- [ ] **Step 1: Teste de formatação**

```ts
expect(formatBRL(4500)).toBe("R$ 45,00");
expect(formatBRL(0)).toBe("R$ 0,00");
expect(formatBRL(123456)).toBe("R$ 1.234,56");
expect(formatTime("2026-11-27T17:00:00.000Z")).toBe("14:00");      // UTC-3
expect(formatDate("2026-11-27T02:30:00.000Z")).toBe("26/11");       // ainda dia 26 em SP
expect(formatWeekday("2026-11-27T15:00:00.000Z")).toBe("sexta-feira");
expect(formatPhone("61999998888")).toBe("(61) 99999-8888");
expect(formatPhone("6133334444")).toBe("(61) 3333-4444");
```
(Normalizar o espaço não separável que `Intl` insere em `R$ 45,00` para espaço comum.)

- [ ] **Step 2:** Rodar `npm run test -- format` → FAIL. Implementar com `Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"})` e `formatInTimeZone` de date-fns-tz. Rodar → PASS.
- [ ] **Step 3:** `globals.css`: tokens do PRD §8.2 em `:root` e `.dark` com os hex exatos (incluir `--club` e `--club-fg`), escala tipográfica `12/14/16/18/20/24/30/40/56/72` como `--text-*`, raios `--radius-control: 6px; --radius-card: 10px`, uma única `--shadow-float`, `--duration-fast: 150ms; --duration-base: 200ms`, e `@theme inline` mapeando para as classes acima. Mapear também as variáveis que o shadcn usa (`--background`, `--foreground`, `--ring`, `--destructive`…) para os nossos tokens, para os primitivos herdarem. Foco: `outline 2px var(--focus-ring)` com `outline-offset: 2px`. `body` com `font-variant-numeric` normal; utilitário `tabular-nums` nos horários/valores.
- [ ] **Step 4:** `layout.tsx`: `Big_Shoulders_Display({weight:["800","900"], variable:"--font-display"})`, `Instrument_Sans({variable:"--font-sans"})`, `<html lang="pt-BR" suppressHydrationWarning>`, script inline mínimo que aplica `.dark` conforme `localStorage["afiado:theme"]` ou `prefers-color-scheme` antes da pintura (exceção documentada à regra do `localStorage`: preferência de UI, não dado — comentar no código). Verificar `tnum` da Instrument Sans; se não houver, usar `lining-nums` e alinhar valores à direita (PRD §8.1).
- [ ] **Step 5:** Ajustar `button.tsx` via `cva`: variantes `primary` (marinho), `brand` (vermelho, só CTA público), `secondary`, `ghost`, `destructive`; tamanhos `sm` (h-9), `md` (h-11 = 44px), `lg` (h-12); estado `loading` (prop `loading?: boolean` → spinner Lucide `Loader2` + `disabled` + `aria-busy`). Nota de uso no topo do arquivo.
- [ ] **Step 6:** `PoleStripe` com o gradiente do PRD §8.3; com `animated`, desloca `background-position` em 600ms; parado sob `prefers-reduced-motion`. `Logo`: selo circular 999px com a listra + "AFIADO" em `font-display uppercase`.
- [ ] **Step 7:** `npm run typecheck && npm run lint && npm run test` verdes. Commit `adiciona tokens de design, fontes, tema e formatação`.

### Task 3: Domínio — entidades e schemas

**Files:** Create `src/domain/entities.ts`, `src/domain/phone.ts`, `src/domain/entities.test.ts`, `src/domain/phone.test.ts`.

**Interfaces — Produces** (schema Zod `XSchema` + `type X = z.infer<typeof XSchema>` para cada um; `id: string` em todos; `Cents = z.number().int().nonnegative()`; `IsoDateTime = z.string().datetime({offset:true})`; `IsoDate` = `YYYY-MM-DD`; `HHmm` = `"HH:mm"`):

| Entidade | Campos |
|---|---|
| `TimeRange` | `start: HHmm, end: HHmm` |
| `WeeklyHours` | `weekday: 0–6, ranges: TimeRange[]` (vazio = fechado) |
| `Barbershop` | `name, slug, about, address{street,number,district,city,state,zip}, phone, whatsapp, instagram, hours: WeeklyHours[], closures: {date: IsoDate, reason}[], booking: {minAdvanceMinutes, maxDaysAhead, cancelDeadlineHours, bufferMinutes, slotStepMinutes, allowAnyProfessional}, messages: {confirmation, reminder, missYou}` |
| `StaffRole` | `"owner" \| "barber" \| "reception"` |
| `Professional` | `name, role, bio, specialties: string[], photoUrl: string\|null, serviceIds: string[], commissionPct, commissionOverrides: Record<string, number>, clubCommissionCents, hours: WeeklyHours[], active` |
| `TimeOff` | `professionalId, start, end (IsoDateTime), kind: "block"\|"dayoff"\|"vacation", reason` |
| `Service` | `name, category: "corte"\|"barba"\|"combo"\|"tratamento"\|"outros", priceCents, durationMinutes, commissionPct, onlineBooking, active` |
| `Product` | `name, priceCents, costCents, stock, minStock, commissionPct, active` |
| `ClientSource` | `"instagram"\|"google"\|"indicacao"\|"passando"\|"outro"` |
| `Client` | `name, phone, email: string\|null, birthday: IsoDate\|null, source: ClientSource\|null, notes, tags: string[], marketingConsent, createdAt` |
| `AppointmentStatus` | `"scheduled"\|"confirmed"\|"in_service"\|"done"\|"no_show"\|"canceled"` |
| `Appointment` | `clientId, professionalId, serviceIds (min 1), start, end, status, priceCents, note, origin: "online"\|"panel", createdAt, canceledAt: string\|null, orderId: string\|null` |
| `WaitlistEntry` | `clientId, date: IsoDate, serviceIds, professionalId: string\|null, createdAt, notifiedAt: string\|null` |
| `Plan` | `name, priceCents, description, benefits: {serviceId, monthlyLimit: number\|null}[], rules: {minDaysBetweenUses, allowedWeekdays: number[]}, recommended, active` |
| `Subscription` | `clientId, planId, status: "active"\|"past_due"\|"canceling"\|"canceled", paymentMethod: "pix"\|"card", startedAt, currentPeriodStart, currentPeriodEnd, canceledAt: string\|null` |
| `Charge` | `subscriptionId, amountCents, dueDate: IsoDate, status: "paid"\|"pending"\|"failed", paidAt: string\|null` |
| `PaymentMethod` | `"cash"\|"pix"\|"debit"\|"credit"` |
| `OrderItem` | `kind: "service"\|"product", refId, name, quantity (int ≥1), unitPriceCents, discountCents, clubCovered, professionalId` |
| `Order` | `clientId: string\|null, professionalId, appointmentId: string\|null, status: "open"\|"closed"\|"canceled", items: OrderItem[], discountCents, payments: {method: PaymentMethod, amountCents}[], openedAt, closedAt: string\|null, cashSessionId: string\|null` |
| `CashSession` | `openedAt, openedBy, openingCents, closedAt: string\|null, counted: Record<PaymentMethod, number>\|null, note` |
| `CashMovement` | `sessionId, kind: "order"\|"income"\|"expense"\|"withdrawal", method: PaymentMethod, amountCents, description, orderId: string\|null, createdAt` |
| `Commission` | `professionalId, orderId, orderItemId, date, kind: "service"\|"product"\|"club", baseCents, pct: number\|null, amountCents, paidAt: string\|null` |
| `Review` | `appointmentId, clientId, professionalId, rating (int 1–5), comment, createdAt, reply: string\|null` |
| `Session` (não tem id) | `clientId: string\|null, staffId: string\|null, role: StaffRole\|null` |

Também: `DbSnapshot = { version: 1; shop: Barbershop; professionals; timeOff; services; products; clients; appointments; waitlist; plans; subscriptions; charges; orders; cashSessions; cashMovements; commissions; reviews; session: Session }` (arrays das entidades).

Form schemas (usados nas fases seguintes, nascem aqui): `ClientInputSchema` = `{ name: min 2 ("Informe seu nome"), phone: transform normalizePhone + refine isValidPhone ("Telefone inválido. Use DDD + número."), source opcional, marketingConsent default false }`.

- [ ] **Step 1: Testes**

```ts
// phone.test.ts
expect(normalizePhone("(61) 99999-8888")).toBe("61999998888");
expect(normalizePhone("+55 61 99999-8888")).toBe("61999998888");
expect(normalizePhone("55 61 3333 4444")).toBe("6133334444");
expect(isValidPhone("61999998888")).toBe(true);
expect(isValidPhone("6133334444")).toBe(true);     // fixo, 10 dígitos
expect(isValidPhone("61899998888")).toBe(false);   // 11 dígitos sem o 9 do celular
expect(isValidPhone("999998888")).toBe(false);     // sem DDD
expect(isValidPhone("01999998888")).toBe(false);   // DDD inválido (< 11)
// entities.test.ts
expect(ClientInputSchema.parse({name:"Ana", phone:"(61) 99999-8888"}).phone).toBe("61999998888");
expect(ClientInputSchema.safeParse({name:"Ana", phone:"123"}).error?.issues[0]?.message).toBe("Telefone inválido. Use DDD + número.");
expect(ServiceSchema.safeParse({...validService, priceCents: 45.5}).success).toBe(false);
expect(ReviewSchema.safeParse({...validReview, rating: 6}).success).toBe(false);
```
- [ ] **Step 2:** Rodar → FAIL. Implementar. `normalizePhone`: tira não-dígitos; se começar com `55` e tiver 12–13 dígitos, remove o `55`. `isValidPhone`: 10–11 dígitos, DDD 11–99, celular (11 dígitos) começa com 9.
- [ ] **Step 3:** Rodar → PASS. Commit `adiciona entidades e schemas do domínio`.

### Task 4: Repositórios e store mock

**Files:** Create `src/data/repositories.ts`, `src/data/mock/store.ts`, `src/data/mock/store.test.ts`, `src/data/mock/repositories.ts`, `src/data/mock/repositories.test.ts`, `src/data/index.ts`.

**Interfaces:**
- Consumes: `DbSnapshot` e entidades (Task 3); `generateSeed(now: Date): DbSnapshot` (Task 5 — nesta task usar um snapshot mínimo de teste; a ligação ao seed real entra na Task 5).
- Produces (`repositories.ts`):
  ```ts
  type Collection<T extends {id: string}, TCreate = Omit<T, "id">> = {
    list(): Promise<T[]>;
    get(id: string): Promise<T | null>;
    create(input: TCreate): Promise<T>;
    update(id: string, patch: Partial<Omit<T, "id">>): Promise<T>;   // lança NotFoundError
    remove(id: string): Promise<void>;
  };
  type Repositories = {
    shop: { get(): Promise<Barbershop>; update(patch: Partial<Barbershop>): Promise<Barbershop> };
    professionals: Collection<Professional>; timeOff: Collection<TimeOff>;
    services: Collection<Service>; products: Collection<Product>;
    clients: Collection<Client> & { findByPhone(phone: string): Promise<Client | null> };
    appointments: Collection<Appointment> & { listByRange(fromIso: string, toIso: string, professionalId?: string): Promise<Appointment[]> };
    waitlist: Collection<WaitlistEntry>; plans: Collection<Plan>;
    subscriptions: Collection<Subscription>; charges: Collection<Charge>;
    orders: Collection<Order>; cashSessions: Collection<CashSession>; cashMovements: Collection<CashMovement>;
    commissions: Collection<Commission>; reviews: Collection<Review>;
    session: { get(): Promise<Session>; set(patch: Partial<Session>): Promise<Session> };
    demo: { reset(): Promise<void> };
  };
  class NotFoundError extends Error {}  class MockNetworkError extends Error {}
  ```
  Fases seguintes **adicionam** métodos específicos a essas interfaces quando precisarem (ex.: `orders.close(...)`), sempre no mesmo arquivo.
- Produces (`store.ts`): `createStore(opts: { storage: Storage | null; seed: () => DbSnapshot; latency?: [number, number]; random?: () => number }): { read(): DbSnapshot; write(fn: (db: DbSnapshot) => void): void; reset(): void; delay(): Promise<void> }`. Chave `afiado:db:v1`. Erro simulado: se `storage.getItem("afiado:debug:fail") === "1"`, `delay()` rejeita com `MockNetworkError("Não foi possível carregar. Verifique sua conexão.")`.
- Produces (`data/index.ts`): `export const repos: Repositories` (mock; troca por `http/` na V2 por `NEXT_PUBLIC_DATA_SOURCE`).

- [ ] **Step 1: Testes do store** (storage fake em memória, `latency: [0,0]`)
  - `read()` sem nada salvo → devolve o seed e grava em `afiado:db:v1`.
  - JSON inválido salvo → devolve o seed (Review Focus 1).
  - snapshot com `version: 0` → devolve o seed.
  - `storage: null` e storage cujo `setItem` lança `QuotaExceededError` → `write` não lança e `read` reflete a escrita em memória (Review Focus 2).
  - `reset()` → volta ao seed.
  - flag `afiado:debug:fail` = `"1"` → `delay()` rejeita com `MockNetworkError`.
- [ ] **Step 2: Testes dos repositórios**
  - `services.create(x)` gera id único e `list()` o inclui; `update` de id inexistente rejeita com `NotFoundError`.
  - `clients.findByPhone("(61) 99999-8888")` normaliza antes de buscar.
  - `appointments.listByRange` inclui agendamento que começa antes de `from` e termina depois (sobreposição) e filtra por profissional.
  - objetos devolvidos são cópias (mutar o retorno não altera o store).
- [ ] **Step 3:** Rodar → FAIL. Implementar (`crypto.randomUUID()` para ids; `structuredClone` nas leituras; latência 200–600ms por padrão). Rodar → PASS.
- [ ] **Step 4:** Commit `adiciona repositórios e store mock com persistência`.

### Task 5: Seed determinístico

**Files:** Create `src/lib/random.ts`, `src/data/mock/seed.ts`, `src/data/mock/seed.test.ts`; Modify `src/data/index.ts` (seed = `() => generateSeed(new Date())`).

**Interfaces:**
- Produces: `createRandom(seed: number): { next(): number; int(min, max): number; pick<T>(arr: readonly T[]): T; chance(p: number): boolean }` (mulberry32). `generateSeed(now: Date): DbSnapshot` — mesmo `now` ⇒ snapshot idêntico (ids determinísticos `"pro-1"`, `"cli-12"`…; nada de `randomUUID` no seed).

**Valores fixos do seed (todos rotulados como exemplo na interface):**
- Barbearia "Afiado" em Brasília/DF; horário ter–sex 09:00–20:00, sáb 08:00–18:00, dom e seg fechado; booking `{minAdvanceMinutes: 60, maxDaysAhead: 30, cancelDeadlineHours: 3, bufferMinutes: 0, slotStepMinutes: 15, allowAnyProfessional: true}`.
- 4 profissionais: 1 `owner` que também atende + 3 `barber`; comissão padrão 40% (um com override 50% em barba); `clubCommissionCents: 1500`; um deles com folga às quintas. Mais 1 `reception` sem agenda (não aparece no agendamento: `serviceIds: []`).
- 12 serviços: Corte 4500/30min, Corte + barba 7000/60, Barba 3500/30, Pezinho 1500/15, Corte infantil 4000/30, Degradê 5000/40, Sobrancelha 1500/15, Barboterapia 5500/45, Pigmentação 6000/45, Hidratação 3000/20, Platinado 15000/120, Luzes 12000/90.
- 6 produtos (pomada, óleo de barba, shampoo, balm, cera, pente), 1 deles abaixo do estoque mínimo.
- 60 clientes com nomes e telefones fictícios válidos (DDD 61), origens variadas, ~10 aniversariantes nos próximos 7 dias, ~8 sem visita há 60+ dias.
- 3 planos: "Corte" 9900 (corte ilimitado), "Corte + barba" 14900 (corte ilimitado + 4 barbas/mês, `recommended: true`), "Completo" 19900 (corte e barba ilimitados + 1 tratamento/mês); `minDaysBetweenUses: 7` no corte; todos os dias permitidos.
- ~18 assinaturas: maioria `active`, 2 `past_due`, 1 `canceling`, 2 `canceled`; cobranças mensais correspondentes.
- 90 dias de histórico: agendamentos `done` (com comanda fechada, pagamentos, comissões e movimentos de caixa coerentes), ~6% `no_show`, ~5% `canceled`; caixas fechados por dia útil (o de hoje **não** aberto). Hoje e próximos 14 dias: agendamentos `scheduled`/`confirmed` ocupando ~60% da agenda. Algumas avaliações com nota 4–5 e uma 3.
- `session: { clientId: null, staffId: null, role: null }`.

- [ ] **Step 1: Testes**
  - `generateSeed(now)` duas vezes com o mesmo `now` → `toEqual`.
  - contagens: 5 profissionais (4 com agenda), 12 serviços, 60 clientes, 3 planos.
  - integridade: todo `appointment.clientId/professionalId/serviceIds`, `order.appointmentId`, `commission.orderId`, `charge.subscriptionId` aponta para entidade existente.
  - todo agendamento não cancelado está dentro do expediente da barbearia e do profissional, **no fuso de São Paulo**, e não se sobrepõe a outro do mesmo profissional — inclusive com `now = 2026-11-24T02:50:00Z` (23:50 em SP) e `process.env.TZ = "Asia/Tokyo"` (Review Focus 4).
  - todo `Appointment.end - start` = soma das durações dos serviços.
  - comissões de comandas fechadas: `amountCents === Math.round(baseCents * pct / 100)` (serviço/produto) ou `clubCommissionCents` (clube).
  - `DbSnapshotSchema.parse(seed)` passa.
- [ ] **Step 2:** Rodar → FAIL. Implementar (gerar dia a dia em horário de SP com `fromZonedTime`; ocupar a agenda em blocos de 15 min sem sobreposição). Rodar → PASS.
- [ ] **Step 3:** Commit `adiciona seed determinístico de demonstração`.

### Task 6: Providers e layouts público e painel

**Files:** Create `src/app/providers.tsx` (se ainda não), `src/app/(public)/layout.tsx`, `src/app/(public)/page.tsx`, `src/app/admin/layout.tsx`, `src/app/admin/page.tsx`, `src/features/admin-shell/components/{AdminSidebar,AdminBottomNav,RoleSwitcher}.tsx`, `src/features/admin-shell/hooks/useSession.ts`, `src/features/admin-shell/nav.ts`, `src/features/demo/hooks/useResetDemo.ts`, `src/hooks/useMediaQuery.ts`, `src/lib/query-keys.ts`, `e2e/shell.spec.ts`.

**Interfaces:**
- Consumes: `repos` (Task 4/5).
- Produces: `sessionKeys.all = ["session"]`; `useSession(): UseQueryResult<Session>`; `useSetRole(): UseMutationResult<Session, Error, StaffRole>` (invalida `sessionKeys.all`); `useResetDemo()` (chama `repos.demo.reset()` e `queryClient.clear()` + refetch, toast "Dados de demonstração restaurados").
- Produces: `ADMIN_NAV: { href, label, icon, roles: StaffRole[], mobile: boolean }[]` com as 15 rotas do painel do PRD §7 (sem `/admin/entrar`); `mobile: true` só em Agenda, Comandas, Clientes, Caixa (o resto entra em "Mais").
- QueryClient: `staleTime: 30_000`, `retry: 1`.

- [ ] **Step 1: E2E** `e2e/shell.spec.ts`:
  - home: título "Afiado", landmark `banner` com o logo, link "Entrar", botão/link "Agendar horário" visível nos dois viewports.
  - `/admin` desktop: `navigation` com links "Agenda", "Comandas", "Clientes", "Caixa", "Configurações".
  - `/admin` mobile: barra inferior com os 4 atalhos + botão "Mais" que abre um `Sheet` com o restante.
  - trocar papel para "Barbeiro" no `RoleSwitcher` → "Configurações" e "Relatórios" somem do menu; recarregar mantém o papel.
  - "Resetar dados de demonstração" (no menu do `RoleSwitcher`) → toast "Dados de demonstração restaurados".
- [ ] **Step 2:** Rodar → FAIL. Implementar:
  - `(public)/layout.tsx` (server): `<header>` com `Logo`, "Entrar" (link `/entrar`), `ThemeToggle`; `<main>`; `<footer>` com links Termos/Privacidade. Home provisória: faixa `PoleStripe` de 6px no topo, nome em display, e o CTA `Button variant="brand"` "Agendar horário" → `/agendar` (fixo no rodapé no mobile).
  - `admin/layout.tsx` (server) renderiza `AdminShell` client só na parte interativa: sidebar ≥ `lg`, barra inferior < `lg` com alvos ≥ 44px; topo com `RoleSwitcher` (Dono/Barbeiro/Recepção; papel padrão Dono quando `session.role` é null) e `ThemeToggle`. Busca global e "+ Novo" entram na Fase 2.
  - Rotas ainda não construídas **não** ganham página nesta fase (o link aponta, o 404 padrão do Next é aceitável até a fase da tela).
  - `/admin` provisório: título "Painel" e skeleton do dashboard.
- [ ] **Step 3:** Rodar `npm run typecheck && npm run lint && npm run test && npm run build && npm run test:e2e` → tudo verde.
- [ ] **Step 4:** Conferir no navegador `/` e `/admin` em 375px e 1280px, claro e escuro (Review Focus 5), zoom 200%; tirar screenshots.
- [ ] **Step 5:** Commit `adiciona layouts público e do painel com troca de papel`.

---

## Fim da fase
Resumo ao Leo com screenshots (375px e 1280px). Em seguida, escrever `docs/superpowers/plans/2026-11-23-fase-1-agendar.md` (C1, C2, C3, C7, C8, C9 + `domain/availability.ts`) sobre as interfaces reais desta fase.
