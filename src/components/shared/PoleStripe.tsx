/**
 * PoleStripe — a listra do poste de barbeiro. No máximo UM uso por tela
 * (faixa do topo da home, barra de progresso do agendamento, selo do logo).
 * `animated` gira a listra uma vez (ex.: ao avançar de passo); fica parada
 * com prefers-reduced-motion.
 */
import { cn } from "@/lib/cn";

type PoleStripeProps = {
  className?: string;
  animated?: boolean;
};

export function PoleStripe({ className, animated = false }: PoleStripeProps) {
  return (
    <div
      aria-hidden
      className={cn("pole-stripe", animated && "motion-safe:animate-pole", className)}
    />
  );
}
