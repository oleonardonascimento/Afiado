/**
 * Estados de tela padronizados (RNF-09).
 * - ErrorState: o que aconteceu + como resolver + "Tentar de novo".
 * - EmptyState: o que é + por que está vazio + ação para começar.
 */
import { AlertTriangle, Inbox, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

type ErrorStateProps = {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
};

export function ErrorState({
  title = "Não foi possível carregar",
  description = "Verifique sua conexão e tente de novo.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "rounded-card border-danger/40 bg-surface flex flex-col items-start gap-3 border p-5",
        className,
      )}
    >
      <div className="text-danger flex items-center gap-2 font-medium">
        <AlertTriangle className="size-5" strokeWidth={1.75} aria-hidden />
        {title}
      </div>
      <p className="text-text-muted text-sm">{description}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Tentar de novo
        </Button>
      )}
    </div>
  );
}

type EmptyStateProps = {
  title: string;
  description: string;
  icon?: LucideIcon;
  children?: React.ReactNode;
  className?: string;
};

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  children,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-card border-border-strong bg-surface flex flex-col items-center gap-2 border border-dashed px-5 py-8 text-center",
        className,
      )}
    >
      <Icon className="text-text-muted size-6" strokeWidth={1.75} aria-hidden />
      <p className="font-medium">{title}</p>
      <p className="text-text-muted max-w-sm text-sm">{description}</p>
      {children && (
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          {children}
        </div>
      )}
    </div>
  );
}
