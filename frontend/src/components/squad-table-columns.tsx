import { HandCoins } from "lucide-react";
import { ConditionBadge } from "@/components/ConditionBadge";
import type { Column } from "@/components/DataTable";
import { PenaltyBadge } from "@/components/PenaltyBadge";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { PositionBadge } from "@/components/PositionBadge";
import { Button } from "@/components/ui/button";
import { EMPTY, formatDateTime, formatDays, formatMoney } from "@/lib/format";
import type { SquadPlayer } from "@/types/club";

/** Tudo vem da API; `contract` é `null` se o jogador não tiver contrato ativo. */
export function buildSquadColumns(
  onSell: (player: SquadPlayer) => void,
): Column<SquadPlayer>[] {
  return [
    {
      header: "Jogador",
      cell: (player) => (
        <div className="flex items-center gap-3">
          <PlayerAvatar name={player.name} />
          <span className="font-medium">{player.name}</span>
        </div>
      ),
    },
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
      header: "Condição",
      cell: (player) => <ConditionBadge condition={player.condition} />,
    },
    {
      header: "Valor de mercado",
      cell: (player) => formatMoney(player.market_value),
      className: "text-right font-semibold tabular-nums",
    },
    {
      header: "Valor de compra",
      cell: (player) =>
        player.contract ? formatMoney(player.contract.purchase_value) : EMPTY,
      className: "text-right tabular-nums text-muted-foreground",
    },
    {
      header: "Fim da fidelidade",
      cell: (player) =>
        player.contract ? formatDateTime(player.contract.loyalty_until) : EMPTY,
      className: "tabular-nums",
    },
    {
      header: "Dias restantes",
      cell: (player) =>
        player.contract ? formatDays(player.contract.remaining_days) : EMPTY,
      className: "text-right tabular-nums",
    },
    {
      header: "% de multa",
      cell: (player) =>
        player.contract ? (
          <PenaltyBadge rate={player.contract.penalty_rate} />
        ) : (
          EMPTY
        ),
    },
    {
      header: "Vender",
      srOnlyHeader: true,
      cell: (player) => (
        <Button variant="outline" size="sm" onClick={() => onSell(player)}>
          <HandCoins aria-hidden />
          Vender
        </Button>
      ),
      className: "text-right",
    },
  ];
}
