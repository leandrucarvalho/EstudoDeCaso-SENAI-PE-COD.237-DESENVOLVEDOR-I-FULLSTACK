import { useCallback } from "react";
import { useAsync } from "@/hooks/useAsync";
import { listPlayers } from "@/services/players";
import type { PlayerFilters } from "@/types/player";

export interface PlayerCounts {
  all: number;
  free: number;
  club: number;
}

/**
 * Totais das abas (Todos, Livres, Em clubes) para os filtros atuais.
 * Cada total é o `total_items` de uma consulta com `limit=1`; nada é calculado aqui.
 */
export function usePlayerCounts(filters: PlayerFilters) {
  const fetchCounts = useCallback(async (): Promise<PlayerCounts> => {
    const base: PlayerFilters = {
      ...filters,
      free: undefined,
      sort: undefined,
      page: 1,
      limit: 1,
    };
    const total = (query: PlayerFilters) =>
      listPlayers(query).then((result) => result.meta.total_items);

    // A API recusa `free=true` junto de `club_id`: com clube escolhido não há livres.
    const [all, free, club] = await Promise.all([
      total(base),
      filters.club_id === undefined ? total({ ...base, free: true }) : 0,
      total({ ...base, free: false }),
    ]);

    return { all, free, club };
  }, [filters]);

  return useAsync(fetchCounts);
}
