import { POSITION_LABELS } from "@/lib/player-labels";
import type { Player } from "@/types/player";
import { PlayerAvatar } from "./PlayerAvatar";

export function PlayerCell({ player }: { player: Player }) {
  return (
    <div className="flex items-center gap-3">
      <PlayerAvatar name={player.name} />
      <div>
        <div className="font-medium">{player.name}</div>
        <div className="text-sm text-muted-foreground">
          {POSITION_LABELS[player.position]}
        </div>
      </div>
    </div>
  );
}
