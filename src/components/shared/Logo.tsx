/**
 * Logo provisório: selo circular com a listra do poste + nome em letreiro.
 * O logo definitivo depende de checkpoint com o Leo (CLAUDE.md, passo 2).
 */
import { cn } from "@/lib/cn";

type LogoProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizes = {
  sm: { seal: "size-7", text: "text-2xl" },
  md: { seal: "size-9", text: "text-3xl" },
  lg: { seal: "size-14", text: "text-5xl" },
} as const;

export function Logo({ size = "md", className }: LogoProps) {
  const s = sizes[size];
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span aria-hidden className={cn("pole-stripe rounded-full ring-2 ring-primary", s.seal)} />
      <span
        className={cn(
          "font-display leading-display tracking-display font-black text-primary uppercase dark:text-text",
          s.text,
        )}
      >
        Afiado
      </span>
    </span>
  );
}
