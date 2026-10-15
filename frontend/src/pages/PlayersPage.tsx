import { useCallback, useMemo, useState } from "react";
import { ConditionBadge } from "@/components/ConditionBadge";
import { DataTable, type Column } from "@/components/DataTable";
import { PageHeader } from "@/components/PageHeader";
import { Pagination } from "@/components/Pagination";
import { PlayersToolbar } from "@/components/PlayersToolbar";
import { PositionBadge } from "@/components/PositionBadge";
import { Button } from "@/components/ui/button";
import { useAsync } from "@/hooks/useAsync";
import { useDebounce } from "@/hooks/useDebounce";
import { formatMoney } from "@/lib/format";
import {
  DEFAULT_VIEW,
  hasActiveFilters,
  toFilters,
  type PlayersView,
} from "@/lib/players-view";
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
  const [view, setView] = useState<PlayersView>(DEFAULT_VIEW);
  const debouncedSearch = useDebounce(view.search);

  const { position, condition, scope, sort, page } = view;
  const filters = useMemo(
    () =>
      toFilters({
        search: debouncedSearch,
        position,
        condition,
        scope,
        sort,
        page,
      }),
    [debouncedSearch, position, condition, scope, sort, page],
  );

  const fetchPlayers = useCallback(() => listPlayers(filters), [filters]);
  const { data, error, loading, reload } = useAsync(fetchPlayers);

  // Qualquer mudança de filtro volta para a página 1.
  function change(patch: Partial<PlayersView>) {
    setView((current) => ({ ...current, page: 1, ...patch }));
  }

  const filtered = hasActiveFilters(view);

  return (
    <>
      <PageHeader
        title="Jogadores"
        description="Cadastre jogadores, acompanhe os indicadores e compre os que estão livres."
      />

      <PlayersToolbar
        view={view}
        onChange={change}
        onClear={() => setView(DEFAULT_VIEW)}
      />

      <DataTable
        columns={columns}
        rows={data?.data ?? []}
        getRowKey={(player) => player.id}
        loading={loading}
        error={error}
        onRetry={reload}
        emptyMessage={
          filtered
            ? "Nenhum jogador encontrado com esses filtros."
            : "Nenhum jogador cadastrado ainda."
        }
        emptyAction={
          filtered ? (
            <Button variant="outline" onClick={() => setView(DEFAULT_VIEW)}>
              Limpar filtros
            </Button>
          ) : undefined
        }
      />

      {data && (
        <Pagination
          page={data.meta.page}
          totalPages={data.meta.total_pages}
          totalItems={data.meta.total_items}
          disabled={loading}
          onChange={(next) =>
            setView((current) => ({ ...current, page: next }))
          }
        />
      )}
    </>
  );
}
