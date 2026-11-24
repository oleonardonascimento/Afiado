/**
 * FormField — rótulo + campo + dica + erro (em pt-BR, junto ao campo).
 * O `id` liga o <label> ao campo; o erro é anunciado e referenciado via aria-describedby.
 */
import { Slot } from "radix-ui";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/cn";

type FormFieldProps = {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  className?: string;
  children: React.ReactElement;
};

export function FormField({
  id,
  label,
  error,
  hint,
  className,
  children,
}: FormFieldProps) {
  const describedBy =
    [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") ||
    undefined;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      <Slot.Root
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
      >
        {children}
      </Slot.Root>
      {hint && (
        <p id={`${id}-hint`} className="text-text-muted text-sm">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-danger text-sm">
          {error}
        </p>
      )}
    </div>
  );
}
