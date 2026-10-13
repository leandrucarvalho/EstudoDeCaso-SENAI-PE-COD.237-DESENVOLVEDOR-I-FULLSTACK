import type { Cents } from '../common/money.js';
import { compareNames, toComparable } from '../common/text.js';
import { positionRank } from '../domain/position.js';
import type { Position } from '../domain/position.js';
import type { PlayerSort } from './player.schemas.js';

export interface ListablePlayer {
  id: number;
  name: string;
  position: Position;
  age: number;
  marketValue: Cents;
}

export interface ListingOptions {
  search?: string;
  minValue?: Cents;
  maxValue?: Cents;
  sort: PlayerSort[];
  page: number;
  limit: number;
}

export interface Page<Item> {
  items: Item[];
  totalItems: number;
  totalPages: number;
}

type Comparator = (first: ListablePlayer, second: ListablePlayer) => number;

const COMPARATORS: Record<PlayerSort, Comparator> = {
  name: (a, b) => compareNames(a.name, b.name),
  value_asc: (a, b) => a.marketValue - b.marketValue,
  value_desc: (a, b) => b.marketValue - a.marketValue,
  age_asc: (a, b) => a.age - b.age,
  age_desc: (a, b) => b.age - a.age,
  position: (a, b) => positionRank(a.position) - positionRank(b.position),
};

/**
 * RN07: busca e faixa de valor sobre o valor de mercado, ordenação (com desempate por nome e
 * id) e só então a paginação.
 */
export function listPlayers<Item extends ListablePlayer>(
  players: Item[],
  options: ListingOptions,
): Page<Item> {
  const search =
    options.search === undefined ? undefined : toComparable(options.search);

  const filtered = players.filter(
    (player) =>
      (search === undefined || toComparable(player.name).includes(search)) &&
      (options.minValue === undefined ||
        player.marketValue >= options.minValue) &&
      (options.maxValue === undefined ||
        player.marketValue <= options.maxValue),
  );

  const comparators = [
    ...options.sort.map((key) => COMPARATORS[key]),
    COMPARATORS.name,
  ];
  const sorted = [...filtered].sort(
    (a, b) =>
      comparators.reduce((result, compare) => result || compare(a, b), 0) ||
      a.id - b.id,
  );

  const start = (options.page - 1) * options.limit;
  return {
    items: sorted.slice(start, start + options.limit),
    totalItems: sorted.length,
    totalPages: Math.ceil(sorted.length / options.limit),
  };
}
