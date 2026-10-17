import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface DetailRow {
  label: string;
  /** Explicação em letra menor, abaixo do rótulo. */
  caption?: string;
  value: ReactNode;
  /** Linha de total (fundo e fonte mais fortes). */
  strong?: boolean;
}

/** Linhas "rótulo ... valor" dos resultados de compra e venda. */
export function DetailList({ rows }: { rows: DetailRow[] }) {
  return (
    <dl className="divide-y rounded-lg border">
      {rows.map(({ label, caption, value, strong }) => (
        <div
          key={label}
          className={cn(
            "flex items-center justify-between gap-4 px-3 py-2.5",
            strong && "bg-muted-subtle",
          )}
        >
          <dt>
            <span className={cn("text-sm", strong && "font-semibold")}>
              {label}
            </span>
            {caption && (
              <span className="block text-xs text-muted-foreground">
                {caption}
              </span>
            )}
          </dt>
          <dd
            className={cn(
              "text-right tabular-nums",
              strong ? "text-base font-semibold" : "text-sm font-medium",
            )}
          >
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
