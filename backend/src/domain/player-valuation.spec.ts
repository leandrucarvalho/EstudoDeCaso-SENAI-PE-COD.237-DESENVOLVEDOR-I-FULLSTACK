import { describe, expect, it } from 'vitest';
import {
  calculateBaseValue,
  calculateMarketValue,
  calculateOverall,
} from './player-valuation.js';
import type { Condition } from './position.js';

describe('calculateOverall (RN06)', () => {
  const cases = [
    {
      position: 'MEI',
      pace: 68,
      shooting: 65,
      passing: 80,
      dribbling: 78,
      defending: 52,
      physical: 60,
      expected: 73,
    },
    {
      position: 'ATA',
      pace: 78,
      shooting: 75,
      passing: 73,
      dribbling: 82,
      defending: 48,
      physical: 68,
      expected: 76,
    },
    {
      position: 'LAT',
      pace: 72,
      shooting: 70,
      passing: 78,
      dribbling: 76,
      defending: 70,
      physical: 66,
      expected: 72,
    },
    {
      position: 'ZAG',
      pace: 50,
      shooting: 90,
      passing: 60,
      dribbling: 40,
      defending: 80,
      physical: 75,
      expected: 73,
    },
    {
      position: 'GOL',
      pace: 55,
      shooting: 30,
      passing: 65,
      dribbling: 40,
      defending: 72,
      physical: 68,
      expected: 68,
    },
  ] as const;

  it.each(cases)(
    '$position com atributos do enunciado dá overall $expected',
    (row) => {
      const { position, expected, ...attributes } = row;
      expect(calculateOverall(position, attributes)).toBe(expected);
    },
  );
});

describe('calculateBaseValue (RN06)', () => {
  const cases = [
    { overall: 75, potential: 86, age: 25, expected: 4000 },
    { overall: 60, potential: 70, age: 30, expected: 1000 },
    { overall: 61, potential: 70, age: 30, expected: 1200 },
    { overall: 76, potential: 80, age: 22, expected: 4600 },
    { overall: 85, potential: 92, age: 27, expected: 10000 },
    { overall: 70, potential: 84, age: 21, expected: 3420 },
    { overall: 70, potential: 84, age: 22, expected: 3000 },
    { overall: 45, potential: 90, age: 18, expected: 363 },
    { overall: 40, potential: 66, age: 36, expected: 100 },
  ];

  it.each(cases)(
    'overall $overall, potencial $potential, $age anos vale $expected centavos',
    ({ expected, ...input }) => {
      expect(calculateBaseValue(input)).toBe(expected);
    },
  );
});

describe('calculateMarketValue (RN02 a RN05)', () => {
  const cases: {
    baseValue: number;
    condition: Condition;
    agility: number;
    age: number;
    expected: number;
  }[] = [
    {
      baseValue: 8200,
      condition: 'APTO',
      agility: 20,
      age: 25,
      expected: 8200,
    },
    {
      baseValue: 8200,
      condition: 'APTO',
      agility: 50,
      age: 19,
      expected: 9020,
    },
    {
      baseValue: 8200,
      condition: 'MAL_CONDICIONADO',
      agility: 50,
      age: 25,
      expected: 6970,
    },
    {
      baseValue: 8200,
      condition: 'MAL_CONDICIONADO',
      agility: 80,
      age: 21,
      expected: 8405,
    },
    {
      baseValue: 8200,
      condition: 'MAL_CONDICIONADO',
      agility: 30,
      age: 33,
      expected: 5330,
    },
    {
      baseValue: 8200,
      condition: 'DOENTE',
      agility: 90,
      age: 25,
      expected: 6970,
    },
    {
      baseValue: 8200,
      condition: 'DOENTE',
      agility: 30,
      age: 25,
      expected: 4920,
    },
    {
      baseValue: 8200,
      condition: 'DOENTE',
      agility: 10,
      age: 40,
      expected: 4920,
    },
    {
      baseValue: 950,
      condition: 'MAL_CONDICIONADO',
      agility: 85,
      age: 25,
      expected: 879,
    },
    {
      baseValue: 100,
      condition: 'MAL_CONDICIONADO',
      agility: 50,
      age: 35,
      expected: 100,
    },
  ];

  it.each(cases)(
    'base $baseValue, $condition, agilidade $agility, $age anos vale $expected',
    ({ expected, ...input }) => {
      expect(calculateMarketValue(input)).toBe(expected);
    },
  );

  it('aplica o desconto da agilidade só quando o jogador não está APTO', () => {
    const apto = calculateMarketValue({
      baseValue: 4000,
      condition: 'APTO',
      agility: 10,
      age: 25,
    });
    expect(apto).toBe(4000);
  });
});
