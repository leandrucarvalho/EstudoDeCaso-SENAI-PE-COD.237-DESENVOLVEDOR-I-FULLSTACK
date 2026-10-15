import { Badge } from "@/components/ui/badge";
import { CONDITION_LABELS } from "@/lib/player-labels";
import type { Condition } from "@/types/player";

const CLASS_NAMES: Record<Condition, string> = {
  APTO: "border-success-soft-border bg-success-soft text-success-soft-foreground",
  MAL_CONDICIONADO:
    "border-warning-soft-border bg-warning-soft text-warning-soft-foreground",
  DOENTE:
    "border-destructive-soft-border bg-destructive-soft text-destructive-soft-foreground",
};

export function ConditionBadge({ condition }: { condition: Condition }) {
  const label = CONDITION_LABELS[condition];
  const className = CLASS_NAMES[condition];

  return (
    <Badge variant="outline" className={className}>
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {label}
    </Badge>
  );
}
