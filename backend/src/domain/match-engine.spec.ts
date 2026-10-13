import { describe, expect, it } from 'vitest';
import { playMatch, type Starter } from './match-engine.js';
import { buildStandings } from './standings.js';
import { positionsFitFormation } from './lineup-rules.js';

function starter(
  id: number,
  name: string,
  position: Starter['position'],
  overrides: Partial<Starter['attributes']> & {
    condition?: Starter['condition'];
  },
): Starter {
  const { condition = 'APTO', ...attributes } = overrides;
  return {
    id,
    name,
    position,
    condition,
    attributes: {
      pace: 50,
      shooting: 50,
      passing: 50,
      dribbling: 50,
      defending: 50,
      physical: 50,
      ...attributes,
    },
  };
}

// Exemplo completo da RN20: Águias FC 1 x 2 Delta FC, os dois no 2-1-1.
const eagles: Starter[] = [
  starter(34, 'Otto Rangel', 'ATA', { shooting: 75 }),
  starter(30, 'Rui Prado', 'GOL', { defending: 77 }),
  starter(31, 'Davi Lins', 'LAT', {
    dribbling: 74,
    defending: 66,
    condition: 'MAL_CONDICIONADO',
  }),
  starter(33, 'Lauro Neves', 'MEI', { passing: 82 }),
  starter(32, 'Téo Brandão', 'ZAG', { defending: 84 }),
];
const delta: Starter[] = [
  starter(40, 'Ivo Teles', 'GOL', { defending: 72 }),
  starter(41, 'Hugo Vaz', 'ZAG', { defending: 84 }),
  starter(42, 'Lino Matos', 'LAT', { dribbling: 79, defending: 63 }),
  starter(43, 'Nei Soares', 'MEI', { passing: 70 }),
  starter(44, 'Ugo Falcão', 'ATA', { shooting: 81 }),
];

describe('playMatch (RN20)', () => {
  const outcome = playMatch(eagles, delta);

  it('calcula o placar do exemplo do enunciado', () => {
    expect(outcome.homeGoals).toBe(1);
    expect(outcome.awayGoals).toBe(2);
    expect(outcome.result).toBe('VISITANTE');
  });

  it('numera os 6 duelos: 3 ataques do mandante e depois 3 do visitante', () => {
    expect(outcome.duels.map((duel) => duel.order)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(outcome.duels.map((duel) => duel.goal)).toEqual([
      true,
      false,
      false,
      true,
      false,
      true,
    ]);
  });

  it('aplica 15% a menos ao titular MAL_CONDICIONADO, arredondando o meio para cima', () => {
    const duel3 = outcome.duels[2];
    expect(duel3.attacker.playerName).toBe('Davi Lins');
    expect(duel3.attacker.value).toBe(63);
    expect(duel3.defender.value).toBe(63);
    expect(duel3.goal).toBe(false);
    expect(outcome.duels[5].defender.value).toBe(56);
  });

  it('não depende da ordem em que os titulares chegam', () => {
    const shuffled = playMatch([...eagles].reverse(), [...delta].reverse());
    expect(shuffled).toEqual(outcome);
  });
});

describe('positionsFitFormation (RN19)', () => {
  it('aceita as posições que fecham a formação', () => {
    expect(
      positionsFitFormation('2-1-1', ['GOL', 'ZAG', 'LAT', 'MEI', 'ATA']),
    ).toBe(true);
    expect(
      positionsFitFormation('3-1', ['GOL', 'ZAG', 'LAT', 'LAT', 'ATA']),
    ).toBe(true);
    expect(
      positionsFitFormation('1-2-1', ['GOL', 'ZAG', 'MEI', 'MEI', 'ATA']),
    ).toBe(true);
  });

  it('recusa quando falta goleiro ou o setor não fecha', () => {
    expect(
      positionsFitFormation('2-1-1', ['ZAG', 'ZAG', 'LAT', 'MEI', 'ATA']),
    ).toBe(false);
    expect(
      positionsFitFormation('2-2', ['GOL', 'ZAG', 'LAT', 'MEI', 'ATA']),
    ).toBe(false);
  });
});

describe('buildStandings (RN21)', () => {
  it('reproduz a classificação de exemplo do enunciado', () => {
    const clubs = [
      { id: 1, name: 'Águias FC' },
      { id: 2, name: 'Delta FC' },
      { id: 3, name: 'Gama SC' },
      { id: 4, name: 'Épsilon EC' },
      { id: 5, name: 'Mangue FC' },
      { id: 6, name: 'Tubarões EC' },
    ];
    const matches = [
      { homeClubId: 1, awayClubId: 2, homeGoals: 1, awayGoals: 2 },
      { homeClubId: 3, awayClubId: 4, homeGoals: 2, awayGoals: 1 },
      { homeClubId: 4, awayClubId: 1, homeGoals: 3, awayGoals: 2 },
      { homeClubId: 2, awayClubId: 3, homeGoals: 0, awayGoals: 1 },
    ];

    const table = buildStandings(clubs, matches);

    expect(table.map((row) => row.clubName)).toEqual([
      'Gama SC',
      'Épsilon EC',
      'Delta FC',
      'Mangue FC',
      'Tubarões EC',
      'Águias FC',
    ]);
    expect(table.map((row) => row.position)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(table[0]).toMatchObject({
      points: 6,
      goalDifference: 2,
      goalsFor: 3,
    });
    expect(table[5]).toMatchObject({
      points: 0,
      goalDifference: -2,
      goalsFor: 3,
    });
  });
});
