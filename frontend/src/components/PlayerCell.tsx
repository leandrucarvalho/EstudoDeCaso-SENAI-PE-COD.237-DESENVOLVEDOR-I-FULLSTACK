import { getInitials } from "@/lib/format";
import { POSITION_LABELS } from "@/lib/player-labels";
import type { Player } from "@/types/player";

export function PlayerCell({ player }: { player: Player }) {
  return (
    <div className="flex items-center gap-3">
      <span
        aria-hidden
        className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground"
      >
        {getInitials(player.name)}
      </span>
      <div>
        <div className="font-medium">{player.name}</div>
        <div className="text-sm text-muted-foreground">
          {POSITION_LABELS[player.position]}
        </div>
      </div>
    </div>
  );
}
