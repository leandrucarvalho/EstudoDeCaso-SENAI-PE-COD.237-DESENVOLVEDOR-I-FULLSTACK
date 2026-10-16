import { useCallback, useMemo, useState } from "react";
import { DataTable } from "@/components/DataTable";
import { PageHeader } from "@/components/PageHeader";
import { Pagination } from "@/components/Pagination";
import { PlayersListHeader } from "@/components/PlayersListHeader";
import { PlayersToolbar } from "@/components/PlayersToolbar";
import { buildPlayerColumns } from "@/components/players-table-columns";
import { Button } from "@/components/ui/button";
import { useAsync } from "@/hooks/useAsync";
import { useDebounce } from "@/hooks/useDebounce";
import { usePlayerCounts } from "@/hooks/usePlayerCounts";
import {
  ALL,
  DEFAULT_VIEW,
  PAGE_SIZE,
  hasActiveFilters,
  toFilters,
  type PlayersView,
} from "@/lib/players-view";
import { listClubs } from "@/services/clubs";
import { listPlayers } from "@/services/players";
import { Plus, Users } from "lucide-react";
import { PlayerFormDialog } from "@/components/PlayerFormDialog";

export function PlayersPage() {
  const [view, setView] = useState<PlayersView>(DEFAULT_VIEW);
  const [creating, setCreating] = useState(false);
  const debouncedView = useDebounce(view);

  const filters = useMemo(() => toFilters(debouncedView), [debouncedView]);
  const fetchPlayers = useCallback(() => listPlayers(filters), [filters]);
  const { data, error, loading, reload } = useAsync(fetchPlayers);

  // Totais das abas: mesmos filtros, sem aba, ordenação e página.
  const {
    search,
    position,
    condition,
    club,
    minAge,
    maxAge,
    minValue,
    maxValue,
  } = debouncedView;
  const countFilters = useMemo(
    () =>
      toFilters({
        ...DEFAULT_VIEW,
        search,
        position,
        condition,
        club,
        minAge,
        maxAge,
        minValue,
        maxValue,
      }),
    [search, position, condition, club, minAge, maxAge, minValue, maxValue],
  );
  const { data: counts, reload: reloadCounts } = usePlayerCounts(countFilters);

  // `listClubs` é uma função do módulo (referência estável).
  const { data: clubs } = useAsync(listClubs);
  const columns = useMemo(() => {
    const byId = new Map((clubs ?? []).map((item) => [item.id, item] as const));
    return buildPlayerColumns(byId);
  }, [clubs]);

  // Qualquer mudança de filtro volta para a página 1.
  // "Livres" não combina com clube (a API recusa): entrar em "Livres" limpa o clube.
  function change(patch: Partial<PlayersView>) {
    setView((current) => {
      const next = { ...current, page: 1, ...patch };
      return next.scope === "free" ? { ...next, club: ALL } : next;
    });
  }

  const filtered = hasActiveFilters(view);

  return (
    <>
      <PageHeader
        icon={Users}
        title="Jogadores"
        description="Cadastre jogadores, acompanhe os indicadores e compre os que estão livres."
        action={
          <Button onClick={() => setCreating(true)}>
            <Plus aria-hidden />
            Novo jogador
          </Button>
        }
      />

      <PlayersToolbar
        view={view}
        clubs={clubs ?? []}
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
        toolbar={
          <PlayersListHeader view={view} counts={counts} onChange={change} />
        }
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
        footer={
          data && data.meta.total_items > 0 ? (
            <Pagination
              page={data.meta.page}
              totalPages={data.meta.total_pages}
              totalItems={data.meta.total_items}
              limit={PAGE_SIZE}
              itemName={{ singular: "jogador", plural: "jogadores" }}
              disabled={loading}
              onChange={(next) =>
                setView((current) => ({ ...current, page: next }))
              }
            />
          ) : undefined
        }
      />

      <p className="mt-4 text-sm text-muted-foreground">
        Overall e valor de mercado são calculados a cada consulta. A busca
        ignora maiúsculas, minúsculas e acentos.
      </p>
      {creating && (
        <PlayerFormDialog
          onClose={() => setCreating(false)}
          onSaved={() => {
            reload();
            reloadCounts();
          }}
        />
      )}
    </>
  );
}
