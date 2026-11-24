/** Nota em estrelas (somente leitura). O valor também vai em texto para leitores de tela. */
import { Star } from "lucide-react";
import { cn } from "@/lib/cn";

type StarsProps = { value: number; className?: string };

export function Stars({ value, className }: StarsProps) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} role="img" aria-label={`Nota ${value} de 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn("size-4", n <= Math.round(value) ? "fill-warning text-warning" : "text-border-strong")}
          strokeWidth={1.75}
          aria-hidden
        />
      ))}
    </span>
  );
}
