import { CircleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FormFieldProps {
  /** Mesmo `id` do controle; a mensagem usa `${id}-message`. */
  id: string;
  label: string;
  hint?: string;
  error?: string;
  className?: string;
  children: ReactNode;
}

/**
 * Rótulo visível + controle + mensagem. O controle deve receber
 * `aria-describedby={`${id}-message`}` e `aria-invalid={Boolean(error)}`.
 */
export function FormField({
  id,
  label,
  hint,
  error,
  className,
  children,
}: FormFieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {children}
      <p
        id={`${id}-message`}
        aria-live="polite"
        className={cn(
          "flex min-h-4 items-start gap-1.5 text-xs",
          error ? "text-destructive" : "text-muted-foreground",
        )}
      >
        {error && (
          <CircleAlert aria-hidden className="mt-px size-3.5 shrink-0" />
        )}
        {error ?? hint}
      </p>
    </div>
  );
}