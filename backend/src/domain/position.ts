import { compareNames } from '../common/text.js';

export const POSITIONS = ['GOL', 'ZAG', 'LAT', 'MEI', 'ATA'] as const;
export type Position = (typeof POSITIONS)[number];

export const CONDITIONS = ['APTO', 'MAL_CONDICIONADO', 'DOENTE'] as const;
export type Condition = (typeof CONDITIONS)[number];

export const ATTRIBUTES = [
  'pace',
  'shooting',
  'passing',
  'dribbling',
  'defending',
  'physical',
] as const;
export type AttributeName = (typeof ATTRIBUTES)[number];
export type Attributes = Record<AttributeName, number>;

/** Ordem de trás para frente usada no elenco, na escalação e na listagem por posição. */
export function positionRank(position: Position): number {
  return POSITIONS.indexOf(position);
}

export interface SquadMember {
  id: number;
  name: string;
  position: Position;
}

/** RN11: posição (GOL, ZAG, LAT, MEI, ATA), depois nome (alfabético do enunciado) e depois id. */
export function compareSquadOrder(
  first: SquadMember,
  second: SquadMember,
): number {
  return (
    positionRank(first.position) - positionRank(second.position) ||
    compareNames(first.name, second.name) ||
    first.id - second.id
  );
}
