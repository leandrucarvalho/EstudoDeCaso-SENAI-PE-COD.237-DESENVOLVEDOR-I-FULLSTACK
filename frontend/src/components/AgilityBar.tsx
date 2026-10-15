import { cn } from "@/lib/utils";

function barColor(value: number): string {
  if (value >= 80) return "bg-success";
  if (value <= 30) return "bg-destructive";
  return "bg-muted-foreground";
}

/** Só apresenta o valor que a API devolveu; as faixas apenas escolhem a cor. */
export function AgilityBar({ value }: { value: number }) {
  return (
    <div className="flex items-center justify-end gap-2">
      <span className="tabular-nums">{value}</span>
      <div aria-hidden className="h-1.5 w-12 rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full", barColor(value))}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
