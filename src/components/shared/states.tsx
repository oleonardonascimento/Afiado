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
      className={cn("flex flex-col items-start gap-3 rounded-card border border-danger/40 bg-surface p-5", className)}
    >
      <div className="flex items-center gap-2 font-medium text-danger">
        <AlertTriangle className="size-5" strokeWidth={1.75} aria-hidden />
        {title}
      </div>
      <p className="text-sm text-text-muted">{description}</p>
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

export function EmptyState({ title, description, icon: Icon = Inbox, children, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 rounded-card border border-dashed border-border-strong bg-surface px-5 py-8 text-center",
        className,
      )}
    >
      <Icon className="size-6 text-text-muted" strokeWidth={1.75} aria-hidden />
      <p className="font-medium">{title}</p>
      <p className="max-w-sm text-sm text-text-muted">{description}</p>
      {children && <div className="mt-2 flex flex-wrap justify-center gap-2">{children}</div>}
    </div>
  );
}
