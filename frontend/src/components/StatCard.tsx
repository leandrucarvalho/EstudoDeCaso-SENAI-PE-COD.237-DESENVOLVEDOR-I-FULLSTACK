import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  /** Texto menor ao lado do valor (ex.: "moedas"). */
  unit?: string;
  caption: string;
}

export function StatCard({
  icon: Icon,
  label,
  value,
  unit,
  caption,
}: StatCardProps) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{label}</span>
        <Icon aria-hidden className="size-4" />
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums">
        {value}
        {unit && (
          <span className="ml-1.5 text-sm font-normal text-muted-foreground">
            {unit}
          </span>
        )}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{caption}</p>
    </div>
  );
}