import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatPercent } from "@/lib/format";

// As faixas só escolhem a cor; o percentual vem da API.
function className(rate: number): string {
  if (rate === 0) {
    return "border-success-soft-border bg-success-soft text-success-soft-foreground";
  }
  if (rate >= 20) {
    return "border-destructive-soft-border bg-destructive-soft text-destructive-soft-foreground";
  }
  return "border-warning-soft-border bg-warning-soft text-warning-soft-foreground";
}

export function PenaltyBadge({ rate }: { rate: number }) {
  return (
    <Badge variant="outline" className={className(rate)}>
      {rate === 0 && <Check aria-hidden />}
      {formatPercent(rate)}
    </Badge>
  );
}