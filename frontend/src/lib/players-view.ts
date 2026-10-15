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
  /** `ALL` ou o id do clube como texto (valor do `Select`). */
  club: string;
  scope: PlayersScope;
  minAge: string;
  maxAge: string;
  minValue: string;
  maxValue: string;
  sort: PlayerSort;
  page: number;
}

export const DEFAULT_VIEW: PlayersView = {
  search: "",
  position: ALL,
  condition: ALL,
  club: ALL,
  scope: "all",
  minAge: "",
  maxAge: "",
  minValue: "",
  maxValue: "",
  sort: "name",
  page: 1,
};

export interface RangeLimits {
  min: number;
  max: number;
  integer: boolean;
}

export const AGE_LIMITS: RangeLimits = { min: 16, max: 45, integer: true };
export const VALUE_LIMITS: RangeLimits = { min: 0, max: 550, integer: false };

const INTEGER_PATTERN = /^\d+$/;
const DECIMAL_PATTERN = /^\d+([.,]\d{1,2})?$/;

const FREE_BY_SCOPE: Record<PlayersScope, boolean | undefined> = {
  all: undefined,
  free: true,
  club: false,
};

export function toNumber(text: string): number {
  return Number(text.trim().replace(",", "."));
}

/** Mensagem de erro da faixa, ou `null` se estiver válida (ou vazia). */
export function rangeError(
  minText: string,
  maxText: string,
  limits: RangeLimits,
): string | null {
  const min = minText.trim();
  const max = maxText.trim();
  const filled = [min, max].filter((text) => text !== "");
  const pattern = limits.integer ? INTEGER_PATTERN : DECIMAL_PATTERN;

  if (filled.some((text) => !pattern.test(text))) {
    return limits.integer
      ? "Use números inteiros."
      : "Use números com até 2 casas decimais.";
  }

  if (
    filled.some(
      (text) => toNumber(text) < limits.min || toNumber(text) > limits.max,
    )
  ) {
    return `Use valores de ${limits.min} a ${limits.max}.`;
  }

  if (min !== "" && max !== "" && toNumber(min) > toNumber(max)) {
    return "O mínimo não pode ser maior que o máximo.";
  }

  return null;
}

function activeRange(
  minText: string,
  maxText: string,
  limits: RangeLimits,
): { min?: number; max?: number } {
  if (rangeError(minText, maxText, limits) !== null) return {};

  return {
    min: minText.trim() === "" ? undefined : toNumber(minText),
    max: maxText.trim() === "" ? undefined : toNumber(maxText),
  };
}

export function hasActiveFilters(view: PlayersView): boolean {
  return (
    view.search.trim() !== "" ||
    view.position !== ALL ||
    view.condition !== ALL ||
    view.club !== ALL ||
    view.scope !== "all" ||
    view.minAge.trim() !== "" ||
    view.maxAge.trim() !== "" ||
    view.minValue.trim() !== "" ||
    view.maxValue.trim() !== ""
  );
}

/** Converte o estado da tela nos parâmetros que a API aceita. */
export function toFilters(view: PlayersView): PlayerFilters {
  const search = view.search.trim();
  const age = activeRange(view.minAge, view.maxAge, AGE_LIMITS);
  const value = activeRange(view.minValue, view.maxValue, VALUE_LIMITS);

  return {
    search: search.length >= 2 ? search : undefined,
    position: view.position === ALL ? undefined : view.position,
    condition: view.condition === ALL ? undefined : view.condition,
    club_id: view.club === ALL ? undefined : Number(view.club),
    free: FREE_BY_SCOPE[view.scope],
    min_age: age.min,
    max_age: age.max,
    min_value: value.min,
    max_value: value.max,
    sort: [view.sort],
    page: view.page,
    limit: PAGE_SIZE,
  };
}
