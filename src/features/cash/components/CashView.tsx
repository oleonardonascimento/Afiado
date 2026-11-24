"use client";

/** A6: caixa — abrir, totais por forma, movimentos, lançamentos, fechar com conferência e histórico. */
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Landmark,
  Receipt,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { MoneyInput } from "@/components/shared/MoneyInput";
import { PageHeader } from "@/components/shared/PageHeader";
import { ErrorState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { OperationError } from "@/data/repositories";
import { cashDifference, cashExpected } from "@/domain/cash";
import { PAYMENT_METHODS, type CashMovement } from "@/domain/entities";
import { CloseCashDialog } from "@/features/cash/components/CloseCashDialog";
import { MovementDialog } from "@/features/cash/components/MovementDialog";
import {
  useCashMovements,
  useCashSessions,
  useOpenCash,
} from "@/features/cash/hooks/useCash";
import { useStaffMember } from "@/hooks/useSession";
import { cn } from "@/lib/cn";
import { formatBRL, formatDate, formatTime } from "@/lib/format";
import { PAYMENT_METHOD_LABEL } from "@/lib/labels";

const KIND_LABEL: Record<CashMovement["kind"], string> = {
  order: "Comanda",
  income: "Entrada",
  expense: "Saída",
  withdrawal: "Sangria",
};
const HISTORY = 10;

export function CashView() {
  const sessions = useCashSessions();
  const movements = useCashMovements();
  const openCash = useOpenCash();
  const { staff } = useStaffMember();
  const [opening, setOpening] = useState<number | null>(null);
  const [movementKind, setMovementKind] = useState<
    "income" | "expense" | "withdrawal" | null
  >(null);
  const [closing, setClosing] = useState(false);

  if (sessions.isError || movements.isError) {
    return (
      <ErrorState
        onRetry={() =>
          void Promise.all([sessions.refetch(), movements.refetch()])
        }
      />
    );
  }
  if (sessions.isLoading || movements.isLoading)
    return <Skeleton className="rounded-card mx-auto h-96 max-w-4xl" />;

  const all = sessions.data ?? [];
  const session = all.find((s) => s.closedAt === null) ?? null;
  const history = all
    .filter((s) => s.closedAt !== null)
    .sort((a, b) => b.openedAt.localeCompare(a.openedAt))
    .slice(0, HISTORY);
  const moves = movements.data ?? [];

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <PageHeader
        title="Caixa"
        description={
          session
            ? `Aberto desde ${formatDate(session.openedAt, "dd/MM")} às ${formatTime(session.openedAt)}`
            : "Caixa fechado"
        }
      >
        {session && (
          <>
            <Button
              variant="secondary"
              onClick={() => setMovementKind("income")}
            >
              <ArrowDownCircle strokeWidth={1.75} aria-hidden />
              Lançar entrada
            </Button>
            <Button
              variant="secondary"
              onClick={() => setMovementKind("expense")}
            >
              <ArrowUpCircle strokeWidth={1.75} aria-hidden />
              Lançar saída
            </Button>
            <Button
              variant="secondary"
              onClick={() => setMovementKind("withdrawal")}
            >
              <Landmark strokeWidth={1.75} aria-hidden />
              Fazer sangria
            </Button>
            <Button onClick={() => setClosing(true)}>Fechar caixa</Button>
          </>
        )}
      </PageHeader>

      {!session ? (
        <section className="rounded-card border-border bg-surface flex flex-col gap-3 border p-5">
          <h2 className="text-lg font-semibold">Abrir caixa</h2>
          <p className="text-text-muted">
            Informe o dinheiro que está na gaveta agora. Comandas só fecham com
            o caixa aberto.
          </p>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="opening">Valor inicial em dinheiro</Label>
              <MoneyInput
                id="opening"
                className="w-44"
                value={opening}
                onChange={setOpening}
              />
            </div>
            <Button
              disabled={opening === null || !staff}
              loading={openCash.isPending}
              onClick={() =>
                staff &&
                opening !== null &&
                openCash.mutate(
                  { openingCents: opening, staffId: staff.id },
                  {
                    onSuccess: () => toast.success("Caixa aberto"),
                    onError: (e) =>
                      toast.error(
                        e instanceof OperationError
                          ? e.message
                          : "Não foi possível abrir o caixa.",
                      ),
                  },
                )
              }
            >
              Abrir caixa
            </Button>
          </div>
        </section>
      ) : (
        <OpenSession
          sessionId={session.id}
          openingCents={session.openingCents}
          movements={moves}
        />
      )}

      <section aria-labelledby="history" className="flex flex-col gap-3">
        <h2 id="history" className="text-lg font-semibold">
          Caixas anteriores
        </h2>
        {history.length === 0 ? (
          <p className="text-text-muted">Nenhum caixa fechado ainda.</p>
        ) : (
          <ul className="divide-border rounded-card border-border bg-surface divide-y border">
            {history.map((s) => {
              const expected = cashExpected(s, moves);
              const diff = s.counted
                ? cashDifference(expected, s.counted)
                : null;
              const total =
                PAYMENT_METHODS.reduce((sum, m) => sum + expected[m], 0) -
                s.openingCents;
              return (
                <li
                  key={s.id}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <span>
                    <span className="block font-medium">
                      {formatDate(s.openedAt, "EEE dd/MM")}
                    </span>
                    {s.note && (
                      <span className="text-text-muted block text-sm">
                        {s.note}
                      </span>
                    )}
                  </span>
                  <span className="flex flex-col items-end text-sm">
                    <span className="tabular-nums">
                      Movimento {formatBRL(total)}
                    </span>
                    <span
                      className={cn(
                        "tabular-nums",
                        !diff || diff.matches
                          ? "text-text-muted"
                          : "text-danger font-medium",
                      )}
                    >
                      {!diff || diff.matches
                        ? "Sem diferença"
                        : `Diferença em ${diff.mismatched
                            .map((m) => {
                              const v = diff.byMethod[m];
                              return `${PAYMENT_METHOD_LABEL[m]} ${v > 0 ? "+" : "−"}${formatBRL(Math.abs(v))}`;
                            })
                            .join(", ")}`}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {session && movementKind && (
        <MovementDialog
          kind={movementKind}
          onClose={() => setMovementKind(null)}
        />
      )}
      {session && closing && (
        <CloseCashDialog
          session={session}
          expected={cashExpected(session, moves)}
          onClose={() => setClosing(false)}
        />
      )}
    </div>
  );
}

function OpenSession({
  sessionId,
  openingCents,
  movements,
}: {
  sessionId: string;
  openingCents: number;
  movements: CashMovement[];
}) {
  const expected = cashExpected({ id: sessionId, openingCents }, movements);
  const list = movements
    .filter((m) => m.sessionId === sessionId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <>
      <section
        aria-label="Totais por forma de pagamento"
        className="rounded-card border-border bg-surface border p-5"
      >
        <dl className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {PAYMENT_METHODS.map((m) => (
            <div key={m} className="flex flex-col gap-1">
              <dt className="text-text-muted text-sm">
                {PAYMENT_METHOD_LABEL[m]}
              </dt>
              <dd className="text-xl font-semibold tabular-nums">
                {formatBRL(expected[m])}
              </dd>
            </div>
          ))}
        </dl>
        <p className="text-text-muted mt-3 text-sm">
          Dinheiro inclui a abertura de {formatBRL(openingCents)}.
        </p>
      </section>
      <section aria-labelledby="moves" className="flex flex-col gap-3">
        <h2 id="moves" className="text-lg font-semibold">
          Movimentos de hoje
        </h2>
        {list.length === 0 ? (
          <p className="text-text-muted">
            Nenhum movimento ainda. Comandas fechadas aparecem aqui.
          </p>
        ) : (
          <ul className="divide-border rounded-card border-border bg-surface divide-y border">
            {list.map((m) => {
              const inflow = m.kind === "order" || m.kind === "income";
              return (
                <li
                  key={m.id}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <span className="flex items-center gap-3">
                    {m.kind === "order" ? (
                      <Receipt
                        className="text-text-muted size-4"
                        strokeWidth={1.75}
                        aria-hidden
                      />
                    ) : inflow ? (
                      <ArrowDownCircle
                        className="text-text-muted size-4"
                        strokeWidth={1.75}
                        aria-hidden
                      />
                    ) : (
                      <ArrowUpCircle
                        className="text-text-muted size-4"
                        strokeWidth={1.75}
                        aria-hidden
                      />
                    )}
                    <span>
                      <span className="block">
                        {KIND_LABEL[m.kind]}
                        {m.description && m.kind !== "order"
                          ? `: ${m.description}`
                          : ""}
                      </span>
                      <span className="text-text-muted text-sm">
                        {formatTime(m.createdAt)} ·{" "}
                        {PAYMENT_METHOD_LABEL[m.method]}
                      </span>
                    </span>
                  </span>
                  <span className="font-medium tabular-nums">
                    {inflow ? "+" : "−"}
                    {formatBRL(m.amountCents)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
