import { Badge } from "@/components/ui/badge";
import type { Position } from "@/types/player";

const LABELS: Record<Position, string> = {
  GOL: "Goleiro",
  ZAG: "Zagueiro",
  LAT: "Lateral",
  MEI: "Meia",
  ATA: "Atacante",
};

export function PositionBadge({ position }: { position: Position }) {
  return <Badge variant="secondary">{LABELS[position]}</Badge>;
}
