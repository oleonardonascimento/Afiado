/**
 * Cadastros fixos do seed de demonstração. Todos os nomes e números são
 * fictícios e a interface os rotula como exemplo.
 */
import type {
  Barbershop,
  Plan,
  Product,
  Professional,
  Service,
  WeeklyHours,
} from "@/domain/entities";
import { createEmptySnapshot } from "@/data/mock/empty-snapshot";

const week = (byDay: Partial<Record<number, [string, string][]>>): WeeklyHours[] =>
  [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({
    weekday,
    ranges: (byDay[weekday] ?? []).map(([start, end]) => ({ start, end })),
  }));

export const SHOP_HOURS = week({
  2: [["09:00", "20:00"]],
  3: [["09:00", "20:00"]],
  4: [["09:00", "20:00"]],
  5: [["09:00", "20:00"]],
  6: [["08:00", "18:00"]],
});

export const shop: Barbershop = {
  ...createEmptySnapshot().shop,
  name: "Afiado",
  slug: "afiado",
  about:
    "Barbearia de bairro na Asa Norte. Corte na tesoura e na máquina, barba com toalha quente e café passado na hora.",
  address: {
    street: "SCLN 210, Bloco B, Loja 12",
    number: "12",
    district: "Asa Norte",
    city: "Brasília",
    state: "DF",
    zip: "70862520",
  },
  phone: "6133334444",
  whatsapp: "61999990000",
  instagram: "afiado.barbearia",
  hours: SHOP_HOURS,
  messages: {
    confirmation:
      "Olá, {nome}! Seu horário na Afiado está marcado para {data} às {hora}. Responda SIM para confirmar.",
    reminder: "Oi, {nome}! Lembrete: amanhã, {data}, às {hora}, tem horário na Afiado.",
    missYou:
      "Oi, {nome}! Faz tempo que você não aparece na Afiado. Quer agendar? É só responder esta mensagem.",
  },
};

const s = (
  n: number,
  name: string,
  category: Service["category"],
  priceCents: number,
  durationMinutes: number,
): Service => ({
  id: `svc-${n}`,
  name,
  category,
  priceCents,
  durationMinutes,
  commissionPct: 40,
  onlineBooking: true,
  active: true,
});

export const services: Service[] = [
  s(1, "Corte", "corte", 4500, 30),
  s(2, "Corte + barba", "combo", 7000, 60),
  s(3, "Barba", "barba", 3500, 30),
  s(4, "Pezinho", "outros", 1500, 15),
  s(5, "Corte infantil", "corte", 4000, 30),
  s(6, "Degradê", "corte", 5000, 40),
  s(7, "Sobrancelha", "outros", 1500, 15),
  s(8, "Barboterapia", "barba", 5500, 45),
  s(9, "Pigmentação", "tratamento", 6000, 45),
  s(10, "Hidratação", "tratamento", 3000, 20),
  s(11, "Platinado", "tratamento", 15000, 120),
  s(12, "Luzes", "tratamento", 12000, 90),
];

const allServiceIds = services.map((x) => x.id);

const pro = (p: Omit<Professional, "active" | "photoUrl" | "clubCommissionCents" | "commissionPct"> & Partial<Professional>): Professional => ({
  active: true,
  photoUrl: null,
  clubCommissionCents: 1500,
  commissionPct: 40,
  ...p,
});

export const professionals: Professional[] = [
  pro({
    id: "pro-1",
    name: "Rafael Moura",
    role: "owner",
    bio: "Dono da casa. Corta há 15 anos e não abre mão da navalha.",
    specialties: ["Navalhado", "Barba clássica"],
    serviceIds: allServiceIds,
    commissionOverrides: {},
    hours: week({
      2: [["10:00", "12:30"], ["13:30", "19:00"]],
      3: [["10:00", "12:30"], ["13:30", "19:00"]],
      4: [["10:00", "12:30"], ["13:30", "19:00"]],
      5: [["10:00", "12:30"], ["13:30", "19:00"]],
      6: [["08:00", "14:00"]],
    }),
  }),
  pro({
    id: "pro-2",
    name: "Diego Alves",
    role: "barber",
    bio: "Especialista em degradê e desenhos. Folga às quintas.",
    specialties: ["Degradê", "Freestyle"],
    serviceIds: allServiceIds,
    commissionOverrides: { "svc-3": 50 },
    hours: week({
      2: [["09:00", "13:00"], ["14:00", "20:00"]],
      3: [["09:00", "13:00"], ["14:00", "20:00"]],
      5: [["09:00", "13:00"], ["14:00", "20:00"]],
      6: [["08:00", "18:00"]],
    }),
  }),
  pro({
    id: "pro-3",
    name: "Lucas Ferreira",
    role: "barber",
    bio: "Química capilar: platinado, luzes e pigmentação.",
    specialties: ["Platinado", "Luzes", "Pigmentação"],
    serviceIds: allServiceIds,
    commissionOverrides: {},
    hours: week({
      2: [["09:00", "13:00"], ["14:00", "20:00"]],
      3: [["09:00", "13:00"], ["14:00", "20:00"]],
      4: [["09:00", "13:00"], ["14:00", "20:00"]],
      5: [["09:00", "13:00"], ["14:00", "20:00"]],
      6: [["08:00", "12:00"], ["13:00", "18:00"]],
    }),
  }),
  pro({
    id: "pro-4",
    name: "Thiago Rocha",
    role: "barber",
    bio: "Corte social e infantil, paciência de sobra com a criançada.",
    specialties: ["Corte social", "Infantil"],
    serviceIds: allServiceIds.filter((id) => !["svc-9", "svc-11", "svc-12"].includes(id)),
    commissionOverrides: {},
    hours: week({
      2: [["11:00", "15:00"], ["16:00", "20:00"]],
      3: [["11:00", "15:00"], ["16:00", "20:00"]],
      4: [["11:00", "15:00"], ["16:00", "20:00"]],
      5: [["11:00", "15:00"], ["16:00", "20:00"]],
      6: [["08:00", "16:00"]],
    }),
  }),
  pro({
    id: "pro-5",
    name: "Camila Duarte",
    role: "reception",
    bio: "Recepção e caixa.",
    specialties: [],
    serviceIds: [],
    commissionOverrides: {},
    clubCommissionCents: 0,
    commissionPct: 0,
    hours: week({}),
  }),
];

const prd = (
  n: number,
  name: string,
  priceCents: number,
  costCents: number,
  stock: number,
  minStock: number,
): Product => ({ id: `prd-${n}`, name, priceCents, costCents, stock, minStock, commissionPct: 10, active: true });

export const products: Product[] = [
  prd(1, "Pomada modeladora", 4500, 2000, 18, 5),
  prd(2, "Óleo para barba", 3900, 1600, 3, 5),
  prd(3, "Shampoo anticaspa", 3500, 1400, 12, 4),
  prd(4, "Balm pós-barba", 3200, 1300, 9, 4),
  prd(5, "Cera efeito seco", 4200, 1800, 14, 5),
  prd(6, "Pente de madeira", 2500, 800, 20, 3),
];

const everyDay = [0, 1, 2, 3, 4, 5, 6];

export const plans: Plan[] = [
  {
    id: "pln-1",
    name: "Corte",
    priceCents: 9900,
    description: "Corte à vontade, uma vez por semana.",
    benefits: [{ serviceId: "svc-1", monthlyLimit: null }],
    rules: { minDaysBetweenUses: 7, allowedWeekdays: everyDay },
    recommended: false,
    active: true,
  },
  {
    id: "pln-2",
    name: "Corte + barba",
    priceCents: 14900,
    description: "Corte à vontade e 4 barbas por mês.",
    benefits: [
      { serviceId: "svc-1", monthlyLimit: null },
      { serviceId: "svc-3", monthlyLimit: 4 },
    ],
    rules: { minDaysBetweenUses: 7, allowedWeekdays: everyDay },
    recommended: true,
    active: true,
  },
  {
    id: "pln-3",
    name: "Completo",
    priceCents: 19900,
    description: "Corte e barba à vontade e 1 hidratação por mês.",
    benefits: [
      { serviceId: "svc-1", monthlyLimit: null },
      { serviceId: "svc-3", monthlyLimit: null },
      { serviceId: "svc-10", monthlyLimit: 1 },
    ],
    rules: { minDaysBetweenUses: 7, allowedWeekdays: everyDay },
    recommended: false,
    active: true,
  },
];

export const FIRST_NAMES = [
  "Gabriel", "Lucas", "Matheus", "Pedro", "Rafael", "Bruno", "Felipe", "João", "Gustavo", "Thiago",
  "Leonardo", "Rodrigo", "Daniel", "Vinícius", "Eduardo", "André", "Caio", "Marcelo", "Henrique", "Igor",
  "Paulo", "Renato", "Sérgio", "Otávio", "Murilo", "Diego", "Samuel", "Arthur", "Heitor", "Davi",
];

export const LAST_NAMES = [
  "Silva", "Santos", "Oliveira", "Souza", "Lima", "Pereira", "Costa", "Rodrigues", "Almeida", "Nascimento",
  "Carvalho", "Gomes", "Martins", "Araújo", "Ribeiro", "Barbosa", "Teixeira", "Mendes", "Freitas", "Cardoso",
];

export const REVIEW_COMMENTS: Record<3 | 4 | 5, string[]> = {
  5: [
    "Melhor degradê que já fiz. Saí outro.",
    "Atendimento pontual e caprichado.",
    "Barba com toalha quente é outro nível.",
    "Ambiente tranquilo e o corte ficou do jeito que pedi.",
    "Agendei em um minuto e fui atendido na hora.",
  ],
  4: [
    "Corte muito bom, só atrasou uns minutos.",
    "Gostei bastante, volto com certeza.",
    "Bom atendimento, preço justo.",
  ],
  3: ["O corte ficou bom, mas esperei mais do que o combinado."],
};
