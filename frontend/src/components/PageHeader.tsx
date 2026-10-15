import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  /** Botão principal da tela (ex.: "Novo jogador"). */
  action?: ReactNode;
}

export function PageHeader({
  title,
  description,
  icon: Icon,
  action,
}: PageHeaderProps) {
  return (
    <header className="mb-6 flex items-start justify-between gap-4">
      <div className="flex items-start gap-4">
        {Icon && (
          <div className="flex size-14 shrink-0 items-center justify-center rounded-xl border bg-primary-soft text-primary">
            <Icon className="size-6" aria-hidden />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description && (
            <p className="mt-1 text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      {action}
    </header>
  );
}
