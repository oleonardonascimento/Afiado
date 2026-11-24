"use client";

/**
 * MoneyInput — campo de valor em reais que trabalha em centavos.
 * Mostra "R$" à esquerda, aceita "45" ou "45,50"; chama onChange(cents | null) a cada digitação.
 * Teclado numérico no celular (inputMode decimal).
 */
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import { centsToInput, parseBRL } from "@/lib/format";

type MoneyInputProps = Omit<
  React.ComponentProps<"input">,
  "value" | "onChange" | "type"
> & {
  value: number | null;
  onChange: (cents: number | null) => void;
};

export function MoneyInput({
  value,
  onChange,
  className,
  ...props
}: MoneyInputProps) {
  const [text, setText] = useState(value === null ? "" : centsToInput(value));
  const [lastValue, setLastValue] = useState(value);
  // Valor mudou por fora (ex.: "preencher com o esperado"): reflete no texto.
  if (value !== lastValue) {
    setLastValue(value);
    if (value !== parseBRL(text))
      setText(value === null ? "" : centsToInput(value));
  }
  return (
    <div className={cn("relative", className)}>
      <span
        aria-hidden
        className="text-text-muted pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
      >
        R$
      </span>
      <Input
        {...props}
        inputMode="decimal"
        autoComplete="off"
        className="pl-10 tabular-nums"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          const cents = parseBRL(e.target.value);
          setLastValue(cents);
          onChange(cents);
        }}
      />
    </div>
  );
}
