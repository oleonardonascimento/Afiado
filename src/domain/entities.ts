/**
 * Entidades do domínio + schemas Zod. Os mesmos schemas serão usados pelo backend (V2).
 * Dinheiro: centavos inteiros. Datas-hora: ISO string com offset. Datas: YYYY-MM-DD.
 */
import { z } from "zod";
import { isValidPhone, normalizePhone } from "@/domain/phone";

export const Cents = z.number().int().nonnegative();
export const IsoDateTime = z.iso.datetime({ offset: true });
export const IsoDate = z.iso.date();
export const HHmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const Id = z.string().min(1);
const Pct = z.number().min(0).max(100);

export const TimeRangeSchema = z.object({ start: HHmm, end: HHmm });
export type TimeRange = z.infer<typeof TimeRangeSchema>;

export const WeeklyHoursSchema = z.object({
  weekday: z.number().int().min(0).max(6),
  ranges: z.array(TimeRangeSchema),
});
export type WeeklyHours = z.infer<typeof WeeklyHoursSchema>;

export const BookingRulesSchema = z.object({
  minAdvanceMinutes: z.number().int().nonnegative(),
  maxDaysAhead: z.number().int().positive(),
  cancelDeadlineHours: z.number().int().nonnegative(),
  bufferMinutes: z.number().int().nonnegative(),
  slotStepMinutes: z.number().int().positive(),
  allowAnyProfessional: z.boolean(),
});
export type BookingRules = z.infer<typeof BookingRulesSchema>;

export const BarbershopSchema = z.object({
  id: Id,
  name: z.string(),
  slug: z.string(),
  about: z.string(),
  address: z.object({
    street: z.string(),
    number: z.string(),
    district: z.string(),
    city: z.string(),
    state: z.string(),
    zip: z.string(),
  }),
  phone: z.string(),
  whatsapp: z.string(),
  instagram: z.string(),
  hours: z.array(WeeklyHoursSchema),
  closures: z.array(z.object({ date: IsoDate, reason: z.string() })),
  booking: BookingRulesSchema,
  messages: z.object({ confirmation: z.string(), reminder: z.string(), missYou: z.string() }),
});
export type Barbershop = z.infer<typeof BarbershopSchema>;

export const StaffRoleSchema = z.enum(["owner", "barber", "reception"]);
export type StaffRole = z.infer<typeof StaffRoleSchema>;

export const ProfessionalSchema = z.object({
  id: Id,
  name: z.string().min(2),
  role: StaffRoleSchema,
  bio: z.string(),
  specialties: z.array(z.string()),
  photoUrl: z.string().nullable(),
  serviceIds: z.array(Id),
  commissionPct: Pct,
  commissionOverrides: z.record(z.string(), Pct),
  clubCommissionCents: Cents,
  hours: z.array(WeeklyHoursSchema),
  active: z.boolean(),
});
export type Professional = z.infer<typeof ProfessionalSchema>;

export const TimeOffSchema = z.object({
  id: Id,
  professionalId: Id,
  start: IsoDateTime,
  end: IsoDateTime,
  kind: z.enum(["block", "dayoff", "vacation"]),
  reason: z.string(),
});
export type TimeOff = z.infer<typeof TimeOffSchema>;

export const ServiceCategorySchema = z.enum(["corte", "barba", "combo", "tratamento", "outros"]);
export type ServiceCategory = z.infer<typeof ServiceCategorySchema>;

export const ServiceSchema = z.object({
  id: Id,
  name: z.string().min(2),
  category: ServiceCategorySchema,
  priceCents: Cents,
  durationMinutes: z.number().int().positive(),
  commissionPct: Pct,
  onlineBooking: z.boolean(),
  active: z.boolean(),
});
export type Service = z.infer<typeof ServiceSchema>;

export const ProductSchema = z.object({
  id: Id,
  name: z.string().min(2),
  priceCents: Cents,
  costCents: Cents,
  stock: z.number().int(),
  minStock: z.number().int().nonnegative(),
  commissionPct: Pct,
  active: z.boolean(),
});
export type Product = z.infer<typeof ProductSchema>;

export const ClientSourceSchema = z.enum(["instagram", "google", "indicacao", "passando", "outro"]);
export type ClientSource = z.infer<typeof ClientSourceSchema>;

export const ClientSchema = z.object({
  id: Id,
  name: z.string().min(2),
  phone: z.string().refine(isValidPhone),
  email: z.email().nullable(),
  birthday: IsoDate.nullable(),
  source: ClientSourceSchema.nullable(),
  notes: z.string(),
  tags: z.array(z.string()),
  marketingConsent: z.boolean(),
  createdAt: IsoDateTime,
});
export type Client = z.infer<typeof ClientSchema>;

export const AppointmentStatusSchema = z.enum([
  "scheduled",
  "confirmed",
  "in_service",
  "done",
  "no_show",
  "canceled",
]);
export type AppointmentStatus = z.infer<typeof AppointmentStatusSchema>;

export const AppointmentSchema = z.object({
  id: Id,
  clientId: Id,
  professionalId: Id,
  serviceIds: z.array(Id).min(1),
  start: IsoDateTime,
  end: IsoDateTime,
  status: AppointmentStatusSchema,
  priceCents: Cents,
  note: z.string(),
  origin: z.enum(["online", "panel"]),
  createdAt: IsoDateTime,
  canceledAt: IsoDateTime.nullable(),
  orderId: Id.nullable(),
});
export type Appointment = z.infer<typeof AppointmentSchema>;

export const WaitlistEntrySchema = z.object({
  id: Id,
  clientId: Id,
  date: IsoDate,
  serviceIds: z.array(Id).min(1),
  professionalId: Id.nullable(),
  createdAt: IsoDateTime,
  notifiedAt: IsoDateTime.nullable(),
});
export type WaitlistEntry = z.infer<typeof WaitlistEntrySchema>;

export const PlanBenefitSchema = z.object({
  serviceId: Id,
  monthlyLimit: z.number().int().positive().nullable(),
});
export type PlanBenefit = z.infer<typeof PlanBenefitSchema>;

export const PlanSchema = z.object({
  id: Id,
  name: z.string().min(2),
  priceCents: Cents,
  description: z.string(),
  benefits: z.array(PlanBenefitSchema).min(1),
  rules: z.object({
    minDaysBetweenUses: z.number().int().nonnegative(),
    allowedWeekdays: z.array(z.number().int().min(0).max(6)),
  }),
  recommended: z.boolean(),
  active: z.boolean(),
});
export type Plan = z.infer<typeof PlanSchema>;

export const SubscriptionStatusSchema = z.enum(["active", "past_due", "canceling", "canceled"]);
export type SubscriptionStatus = z.infer<typeof SubscriptionStatusSchema>;

export const SubscriptionSchema = z.object({
  id: Id,
  clientId: Id,
  planId: Id,
  status: SubscriptionStatusSchema,
  paymentMethod: z.enum(["pix", "card"]),
  startedAt: IsoDateTime,
  currentPeriodStart: IsoDateTime,
  currentPeriodEnd: IsoDateTime,
  canceledAt: IsoDateTime.nullable(),
});
export type Subscription = z.infer<typeof SubscriptionSchema>;

export const ChargeSchema = z.object({
  id: Id,
  subscriptionId: Id,
  amountCents: Cents,
  dueDate: IsoDate,
  status: z.enum(["paid", "pending", "failed"]),
  paidAt: IsoDateTime.nullable(),
});
export type Charge = z.infer<typeof ChargeSchema>;

export const PaymentMethodSchema = z.enum(["cash", "pix", "debit", "credit"]);
export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;
export const PAYMENT_METHODS = PaymentMethodSchema.options;

export const OrderItemSchema = z.object({
  id: Id,
  kind: z.enum(["service", "product"]),
  refId: Id,
  name: z.string(),
  quantity: z.number().int().min(1),
  unitPriceCents: Cents,
  discountCents: Cents,
  clubCovered: z.boolean(),
  professionalId: Id,
});
export type OrderItem = z.infer<typeof OrderItemSchema>;

export const PaymentSchema = z.object({ method: PaymentMethodSchema, amountCents: Cents });
export type Payment = z.infer<typeof PaymentSchema>;

export const OrderSchema = z.object({
  id: Id,
  clientId: Id.nullable(),
  professionalId: Id,
  appointmentId: Id.nullable(),
  status: z.enum(["open", "closed", "canceled"]),
  items: z.array(OrderItemSchema),
  discountCents: Cents,
  payments: z.array(PaymentSchema),
  openedAt: IsoDateTime,
  closedAt: IsoDateTime.nullable(),
  cashSessionId: Id.nullable(),
});
export type Order = z.infer<typeof OrderSchema>;

export const CashSessionSchema = z.object({
  id: Id,
  openedAt: IsoDateTime,
  openedBy: Id,
  openingCents: Cents,
  closedAt: IsoDateTime.nullable(),
  counted: z.record(PaymentMethodSchema, Cents).nullable(),
  note: z.string(),
});
export type CashSession = z.infer<typeof CashSessionSchema>;

export const CashMovementSchema = z.object({
  id: Id,
  sessionId: Id,
  kind: z.enum(["order", "income", "expense", "withdrawal"]),
  method: PaymentMethodSchema,
  amountCents: Cents,
  description: z.string(),
  orderId: Id.nullable(),
  createdAt: IsoDateTime,
});
export type CashMovement = z.infer<typeof CashMovementSchema>;

export const CommissionSchema = z.object({
  id: Id,
  professionalId: Id,
  orderId: Id,
  orderItemId: Id,
  date: IsoDateTime,
  kind: z.enum(["service", "product", "club"]),
  baseCents: Cents,
  pct: Pct.nullable(),
  amountCents: Cents,
  paidAt: IsoDateTime.nullable(),
});
export type Commission = z.infer<typeof CommissionSchema>;

export const ReviewSchema = z.object({
  id: Id,
  appointmentId: Id,
  clientId: Id,
  professionalId: Id,
  rating: z.number().int().min(1).max(5),
  comment: z.string(),
  createdAt: IsoDateTime,
  reply: z.string().nullable(),
});
export type Review = z.infer<typeof ReviewSchema>;

export const SessionSchema = z.object({
  clientId: Id.nullable(),
  staffId: Id.nullable(),
  role: StaffRoleSchema.nullable(),
});
export type Session = z.infer<typeof SessionSchema>;

export const DbSnapshotSchema = z.object({
  version: z.literal(1),
  shop: BarbershopSchema,
  professionals: z.array(ProfessionalSchema),
  timeOff: z.array(TimeOffSchema),
  services: z.array(ServiceSchema),
  products: z.array(ProductSchema),
  clients: z.array(ClientSchema),
  appointments: z.array(AppointmentSchema),
  waitlist: z.array(WaitlistEntrySchema),
  plans: z.array(PlanSchema),
  subscriptions: z.array(SubscriptionSchema),
  charges: z.array(ChargeSchema),
  orders: z.array(OrderSchema),
  cashSessions: z.array(CashSessionSchema),
  cashMovements: z.array(CashMovementSchema),
  commissions: z.array(CommissionSchema),
  reviews: z.array(ReviewSchema),
  session: SessionSchema,
});
export type DbSnapshot = z.infer<typeof DbSnapshotSchema>;

/* ---------- Schemas de formulário ---------- */

export const PhoneInputSchema = z
  .string()
  .transform(normalizePhone)
  .refine(isValidPhone, { message: "Telefone inválido. Use DDD + número." });

export const ClientInputSchema = z.object({
  name: z.string().trim().min(2, { message: "Informe seu nome" }),
  phone: PhoneInputSchema,
  source: ClientSourceSchema.optional(),
  marketingConsent: z.boolean().default(false),
});
export type ClientInput = z.infer<typeof ClientInputSchema>;
