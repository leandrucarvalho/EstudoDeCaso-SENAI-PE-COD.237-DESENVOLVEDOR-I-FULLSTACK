import { type Cents, divideRound } from '../common/money.js';
import type { Attributes, Condition, Position } from './position.js';

const WEIGHTS_BY_POSITION: Record<Position, Attributes> = {
  GOL: {
    pace: 10,
    shooting: 0,
    passing: 20,
    dribbling: 0,
    defending: 40,
    physical: 30,
  },
  ZAG: {
    pace: 10,
    shooting: 0,
    passing: 15,
    dribbling: 0,
    defending: 45,
    physical: 30,
  },
  LAT: {
    pace: 25,
    shooting: 0,
    passing: 20,
    dribbling: 15,
    defending: 25,
    physical: 15,
  },
  MEI: {
    pace: 10,
    shooting: 15,
    passing: 35,
    dribbling: 25,
    defending: 5,
    physical: 10,
  },
  ATA: {
    pace: 20,
    shooting: 40,
    passing: 10,
    dribbling: 20,
    defending: 0,
    physical: 10,
  },
};

/** RN06: soma ponderada dos atributos pela posição, arredondada ao inteiro (meio para cima). */
export function calculateOverall(
  position: Position,
  attributes: Attributes,
): number {
  const weights = WEIGHTS_BY_POSITION[position];
  const weightedSum = (Object.keys(weights) as (keyof Attributes)[]).reduce(
    (total, name) => total + attributes[name] * weights[name],
    0,
  );
  return divideRound(weightedSum, 100);
}

const BASE_VALUE_TIERS = [
  { from: 41, to: 60, centsPerPoint: 50 },
  { from: 61, to: 75, centsPerPoint: 200 },
  { from: 76, to: 99, centsPerPoint: 600 },
];

const YOUNG_PROMISE_MAX_AGE = 21;
const MIN_VALUE: Cents = 100;

export interface BaseValueInput {
  overall: number;
  potential: number;
  /** Idade informada no cadastro. */
  age: number;
}

/** RN06: valor base, calculado uma única vez no cadastro. */
export function calculateBaseValue({
  overall,
  potential,
  age,
}: BaseValueInput): Cents {
  const overallPart = BASE_VALUE_TIERS.reduce((total, tier) => {
    const pointsInTier = Math.max(
      0,
      Math.min(overall, tier.to) - tier.from + 1,
    );
    return total + pointsInTier * tier.centsPerPoint;
  }, 0);

  const value =
    age <= YOUNG_PROMISE_MAX_AGE
      ? divideRound(overallPart * (100 + potential - overall), 100)
      : overallPart;

  return Math.max(value, MIN_VALUE);
}

// Percentuais em décimos de ponto percentual (150 = 15,0%) para manter a conta inteira.
const CONDITION_DISCOUNT: Record<Condition, number> = {
  APTO: 0,
  MAL_CONDICIONADO: 150,
  DOENTE: 300,
};
const HIGH_AGILITY_FROM = 80;
const LOW_AGILITY_UNTIL = 30;
const LOW_AGILITY_EXTRA_DISCOUNT = 100;
const MAX_TOTAL_DISCOUNT = 400;

export interface MarketValueInput {
  baseValue: Cents;
  condition: Condition;
  agility: number;
  /** Idade atual. */
  age: number;
}

/** RN02 (condição): a agilidade só age quando o jogador não está APTO (RN03). */
function conditionDiscount(condition: Condition, agility: number): number {
  const discount = CONDITION_DISCOUNT[condition];
  if (condition === 'APTO') return 0;
  if (agility >= HIGH_AGILITY_FROM) return discount / 2;
  if (agility <= LOW_AGILITY_UNTIL)
    return discount + LOW_AGILITY_EXTRA_DISCOUNT;
  return discount;
}

/** RN04 */
function ageAdjustment(age: number): number {
  if (age <= YOUNG_PROMISE_MAX_AGE) return 100;
  if (age >= 32) return -100;
  return 0;
}

/** RN05: valor de mercado, calculado a cada consulta. */
export function calculateMarketValue(input: MarketValueInput): Cents {
  const total = Math.max(
    ageAdjustment(input.age) -
      conditionDiscount(input.condition, input.agility),
    -MAX_TOTAL_DISCOUNT,
  );
  const value = divideRound(input.baseValue * (1000 + total), 1000);
  return Math.max(value, MIN_VALUE);
}
