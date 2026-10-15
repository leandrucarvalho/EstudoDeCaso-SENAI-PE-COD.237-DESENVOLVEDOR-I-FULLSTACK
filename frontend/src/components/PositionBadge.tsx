import { Badge } from "@/components/ui/badge";
import { POSITION_LABELS } from "@/lib/player-labels";
import type { Position } from "@/types/player";

export function PositionBadge({ position }: { position: Position }) {
  return (
    <Badge variant="outline" title={POSITION_LABELS[position]}>
      {position}
    </Badge>
  );
}
