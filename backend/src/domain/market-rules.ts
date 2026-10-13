import { type Cents, divideRound } from '../common/money.js';

export const STARTING_CASH: Cents = 30_000;
export const MAX_SQUAD_SIZE = 12;
export const MAX_CLUBS = 20;
export const MAX_LOYALTY_DAYS = 1095;

const MILLISECONDS_PER_DAY = 86_400_000;
const FEE_THRESHOLD: Cents = 3_000;
const MAX_PENALTY: Cents = 1_000;
const COMMISSION_BRACKET_LIMIT: Cents = 1_000;

/** RN13: taxa de 5%, cobrada só quando o valor de mercado passa de 30,00. */
export function calculatePurchaseFee(marketValue: Cents): Cents {
  return marketValue > FEE_THRESHOLD ? divideRound(marketValue * 5, 100) : 0;
}

/** RN13: o custo total pode ser, no máximo, metade do caixa (sem arredondar o limite). */
export function isWithinCashLimit(totalCost: Cents, cash: Cents): boolean {
  return totalCost * 2 <= cash;
}

/** RN15: dias restantes, em dias com fração arredondados para cima; 0 se o fim já passou. */
export function calculateRemainingDays(loyaltyUntil: Date, now: Date): number {
  const remaining = loyaltyUntil.getTime() - now.getTime();
  return remaining > 0 ? Math.ceil(remaining / MILLISECONDS_PER_DAY) : 0;
}

/** RN15: percentual da multa pelos dias restantes. */
export function penaltyRateFor(remainingDays: number): number {
  if (remainingDays <= 0) return 0;
  if (remainingDays <= 30) return 5;
  if (remainingDays <= 180) return 10;
  return 20;
}

/** RN15: multa sobre o valor de mercado, limitada a 10,00. */
export function calculatePenalty(
  marketValue: Cents,
  penaltyRate: number,
): Cents {
  return Math.min(divideRound(marketValue * penaltyRate, 100), MAX_PENALTY);
}

/** RN16: 10% sobre a parte do lucro até 10,00 e 20% sobre o que passa disso; sem lucro, zero. */
export function calculateCommission(profit: Cents): Cents {
  if (profit <= 0) return 0;
  const firstBracket = Math.min(profit, COMMISSION_BRACKET_LIMIT);
  const secondBracket = profit - firstBracket;
  return divideRound(firstBracket * 10 + secondBracket * 20, 100);
}

export interface SaleInput {
  marketValue: Cents;
  purchaseValue: Cents;
  remainingDays: number;
}

export interface SaleSettlement {
  penaltyRate: number;
  penalty: Cents;
  profit: Cents;
  commission: Cents;
  credit: Cents;
  contractStatus: 'ENCERRADO' | 'RESCINDIDO';
}

/** RN15 e RN16 juntas: tudo o que a venda gera, a partir do valor de mercado do momento. */
export function settleSale(input: SaleInput): SaleSettlement {
  const penaltyRate = penaltyRateFor(input.remainingDays);
  const penalty = calculatePenalty(input.marketValue, penaltyRate);
  const profit = input.marketValue - input.purchaseValue;
  const commission = calculateCommission(profit);

  return {
    penaltyRate,
    penalty,
    profit,
    commission,
    credit: input.marketValue - penalty - commission,
    contractStatus: penaltyRate > 0 ? 'RESCINDIDO' : 'ENCERRADO',
  };
}
