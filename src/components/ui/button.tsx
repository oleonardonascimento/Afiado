/**
 * Button — ação. Para navegação use `asChild` com <Link>.
 * Variantes: primary (ação principal do painel, marinho), brand (só o CTA
 * principal da página pública, uma vez por tela), secondary, ghost,
 * destructive (perigo). Tamanhos: sm (36px), md (44px, padrão), lg (48px), icon.
 * `loading` desabilita, mostra spinner e marca aria-busy.
 * Teclado: Enter/Espaço (nativo do <button>).
 */
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { Slot } from "radix-ui";
import * as React from "react";
import { cn } from "@/lib/cn";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-control border border-transparent font-medium whitespace-nowrap transition-colors duration-150 select-none disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-danger [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-fg hover:bg-primary/90 active:bg-primary/80",
        brand: "bg-brand text-brand-fg hover:bg-brand/90 active:bg-brand/80",
        secondary:
          "border-border-strong bg-surface text-text hover:bg-surface-2 active:bg-surface-2/70",
        ghost: "text-text hover:bg-surface-2 active:bg-surface-2/70",
        destructive:
          "border-danger bg-surface text-danger hover:bg-danger/10 active:bg-danger/15",
        link: "h-auto px-0 text-primary underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-9 px-3 text-sm",
        md: "h-11 px-4 text-base",
        lg: "h-12 px-6 text-lg",
        icon: "size-11",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    loading?: boolean;
  };

function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={asChild ? undefined : disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {asChild ? (
        children
      ) : (
        <>
          {loading && <Loader2 className="animate-spin" strokeWidth={1.75} aria-hidden />}
          {children}
        </>
      )}
    </Comp>
  );
}

export { Button, buttonVariants };
