import { PlayerAvatar } from "@/components/PlayerAvatar";
import { formatMoney } from "@/lib/format";
import { POSITION_LABELS } from "@/lib/player-labels";
import type { Player } from "@/types/player";

/** Cartão do jogador no topo dos modais de compra e venda. */
export function PlayerSummary({ player }: { player: Player }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-muted-subtle p-3">
      <PlayerAvatar name={player.name} />
      <div className="mr-auto">
        <div className="font-medium">{player.name}</div>
        <div className="text-xs text-muted-foreground">
          {player.position} · {POSITION_LABELS[player.position]} · {player.age}{" "}
          anos
        </div>
      </div>
      <div className="text-right">
        <div className="text-xs text-muted-foreground">Valor de mercado</div>
        <div className="text-lg font-semibold tabular-nums">
          {formatMoney(player.market_value)}
        </div>
      </div>
    </div>
  );
}
