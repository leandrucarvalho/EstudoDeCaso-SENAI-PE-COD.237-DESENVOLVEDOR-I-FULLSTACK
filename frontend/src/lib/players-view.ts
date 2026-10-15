import type {
  Condition,
  PlayerFilters,
  PlayerSort,
  Position,
} from "@/types/player";

export const ALL = "ALL";
export const PAGE_SIZE = 10;

export type PlayersScope = "all" | "free" | "club";

export interface PlayersView {
  search: string;
  position: Position | typeof ALL;
  condition: Condition | typeof ALL;
  scope: PlayersScope;
  sort: PlayerSort;
  page: number;
}

export const DEFAULT_VIEW: PlayersView = {
  search: "",
  position: ALL,
  condition: ALL,
  scope: "all",
  sort: "name",
  page: 1,
};

const FREE_BY_SCOPE: Record<PlayersScope, boolean | undefined> = {
  all: undefined,
  free: true,
  club: false,
};

export function hasActiveFilters(view: PlayersView): boolean {
  return (
    view.search.trim() !== "" ||
    view.position !== ALL ||
    view.condition !== ALL ||
    view.scope !== "all"
  );
}

/** Converte o estado da tela nos parâmetros que a API aceita. */
export function toFilters(view: PlayersView): PlayerFilters {
  const search = view.search.trim();

  return {
    search: search.length >= 2 ? search : undefined,
    position: view.position === ALL ? undefined : view.position,
    condition: view.condition === ALL ? undefined : view.condition,
    free: FREE_BY_SCOPE[view.scope],
    sort: [view.sort],
    page: view.page,
    limit: PAGE_SIZE,
  };
}
