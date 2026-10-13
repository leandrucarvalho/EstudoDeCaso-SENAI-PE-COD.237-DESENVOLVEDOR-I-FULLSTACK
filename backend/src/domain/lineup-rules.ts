import type { Position } from './position.js';

export const FORMATIONS = ['3-1', '2-2', '2-1-1', '1-2-1'] as const;
export type FormationName = (typeof FORMATIONS)[number];

export const LINEUP_SIZE = 5;

interface FormationShape {
  defense: number;
  midfield: number;
  attack: number;
}

const SHAPES: Record<FormationName, FormationShape> = {
  '3-1': { defense: 3, midfield: 0, attack: 1 },
  '2-2': { defense: 2, midfield: 0, attack: 2 },
  '2-1-1': { defense: 2, midfield: 1, attack: 1 },
  '1-2-1': { defense: 1, midfield: 2, attack: 1 },
};

function count(positions: Position[], accepted: Position[]): number {
  return positions.filter((position) => accepted.includes(position)).length;
}

/** RN19: 1 goleiro e, em cada setor, a quantidade da formação (defesa = ZAG ou LAT). */
export function positionsFitFormation(
  formation: FormationName,
  positions: Position[],
): boolean {
  const shape = SHAPES[formation];
  return (
    positions.length === LINEUP_SIZE &&
    count(positions, ['GOL']) === 1 &&
    count(positions, ['ZAG', 'LAT']) === shape.defense &&
    count(positions, ['MEI']) === shape.midfield &&
    count(positions, ['ATA']) === shape.attack
  );
}
