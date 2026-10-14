import { useCallback } from "react";
import { ConditionBadge } from "@/components/ConditionBadge";
import { DataTable, type Column } from "@/components/DataTable";
import { PageHeader } from "@/components/PageHeader";
import { PositionBadge } from "@/components/PositionBadge";
import { useAsync } from "@/hooks/useAsync";
import { formatMoney } from "@/lib/format";
import { listPlayers } from "@/services/players";
import type { Player } from "@/types/player";

const columns: Column<Player>[] = [
  {
    header: "Jogador",
    cell: (player) => player.name,
    className: "font-medium",
  },
  {
    header: "Posição",
    cell: (player) => <PositionBadge position={player.position} />,
  },
  {
    header: "Condição",
    cell: (player) => <ConditionBadge condition={player.condition} />,
  },
  {
    header: "Idade",
    cell: (player) => player.age,
    className: "text-right tabular-nums",
  },
  {
    header: "Overall",
    cell: (player) => player.overall,
    className: "text-right tabular-nums",
  },
  {
    header: "Valor de mercado",
    cell: (player) => formatMoney(player.market_value),
    className: "text-right tabular-nums",
  },
  {
    header: "Clube",
    cell: (player) =>
      player.club_id === null ? "Livre" : `Clube ${player.club_id}`,
  },
];

export function PlayersPage() {
  const fetchPlayers = useCallback(
    () => listPlayers({ page: 1, limit: 10 }),
    [],
  );
  const { data, error, loading, reload } = useAsync(fetchPlayers);

  return (
    <>
      <PageHeader
        title="Jogadores"
        description="Cadastre jogadores, acompanhe os indicadores e compre os que estão livres."
      />
      <DataTable
        columns={columns}
        rows={data?.data ?? []}
        getRowKey={(player) => player.id}
        loading={loading}
        error={error}
        onRetry={reload}
        emptyMessage="Nenhum jogador cadastrado ainda."
      />
    </>
  );
}
