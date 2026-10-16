import { AgilityBar } from "@/components/AgilityBar";
import { ClubCell } from "@/components/ClubCell";
import { ConditionBadge } from "@/components/ConditionBadge";
import type { Column } from "@/components/DataTable";
import {
  PlayerActionsMenu,
  type PlayerAction,
} from "@/components/PlayerActionsMenu";
import { PlayerCell } from "@/components/PlayerCell";
import { PositionBadge } from "@/components/PositionBadge";
import { formatMoney } from "@/lib/format";
import type { Club } from "@/types/club";
import type { Player } from "@/types/player";

export function buildPlayerColumns(
  clubs: Map<number, Club>,
  onAction: (action: PlayerAction, player: Player) => void,
): Column<Player>[] {
  return [
    { header: "Jogador", cell: (player) => <PlayerCell player={player} /> },
    {
      header: "Posição",
      cell: (player) => <PositionBadge position={player.position} />,
    },
    {
      header: "Overall",
      cell: (player) => player.overall,
      className: "text-right font-semibold tabular-nums",
    },
    {
      header: "Agilidade",
      cell: (player) => <AgilityBar value={player.agility} />,
      className: "text-right",
    },
    {
      header: "Idade",
      cell: (player) => player.age,
      className: "text-right tabular-nums",
    },
    {
      header: "Condição",
      cell: (player) => <ConditionBadge condition={player.condition} />,
    },
    {
      header: "Valor base",
      cell: (player) => formatMoney(player.base_value),
      className: "text-right tabular-nums text-muted-foreground",
    },
    {
      header: "Valor de mercado",
      cell: (player) => formatMoney(player.market_value),
      className: "text-right font-semibold tabular-nums",
    },
    {
      header: "Clube",
      cell: (player) => <ClubCell player={player} clubs={clubs} />,
    },
    {
      header: "Ações",
      srOnlyHeader: true,
      cell: (player) => (
        <PlayerActionsMenu player={player} onAction={onAction} />
      ),
      className: "w-12 text-right",
    },
  ];
}