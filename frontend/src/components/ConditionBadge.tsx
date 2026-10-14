import { Badge } from "@/components/ui/badge";
import type { Condition } from "@/types/player";

const CONFIG: Record<Condition, { label: string; className: string }> = {
  APTO: {
    label: "Apto",
    className:
      "border-success-soft-border bg-success-soft text-success-soft-foreground",
  },
  MAL_CONDICIONADO: {
    label: "Mal condicionado",
    className:
      "border-warning-soft-border bg-warning-soft text-warning-soft-foreground",
  },
  DOENTE: {
    label: "Doente",
    className:
      "border-destructive-soft-border bg-destructive-soft text-destructive-soft-foreground",
  },
};

export function ConditionBadge({ condition }: { condition: Condition }) {
  const { label, className } = CONFIG[condition];

  return (
    <Badge variant="outline" className={className}>
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {label}
    </Badge>
  );
}
