import { describe, expect, it } from 'vitest';
import {
  calculateCommission,
  calculatePurchaseFee,
  calculateRemainingDays,
  isWithinCashLimit,
  penaltyRateFor,
  settleSale,
} from './market-rules.js';

describe('calculatePurchaseFee (RN13)', () => {
  it.each([
    { marketValue: 2800, expected: 0 },
    { marketValue: 3000, expected: 0 },
    { marketValue: 3001, expected: 150 },
    { marketValue: 4762, expected: 238 },
    { marketValue: 3700, expected: 185 },
  ])('valor $marketValue paga taxa $expected', ({ marketValue, expected }) => {
    expect(calculatePurchaseFee(marketValue)).toBe(expected);
  });
});

describe('isWithinCashLimit (RN13)', () => {
  it('aceita custo igual a 50% do caixa', () => {
    expect(isWithinCashLimit(5000, 10_000)).toBe(true);
  });

  it('recusa custo acima de 50% do caixa', () => {
    expect(isWithinCashLimit(5040, 10_000)).toBe(false);
  });

  it('não arredonda o limite: 130,58 passa de 50% de 261,15', () => {
    expect(isWithinCashLimit(13_058, 26_115)).toBe(false);
    expect(isWithinCashLimit(13_057, 26_115)).toBe(true);
  });
});

describe('calculateRemainingDays e penaltyRateFor (RN15)', () => {
  const now = new Date('2026-11-05T19:40:00Z');
  const after = (days: number, extraMinutes = 0) =>
    new Date(now.getTime() + days * 86_400_000 + extraMinutes * 60_000);

  it.each([
    { loyaltyUntil: after(-3), days: 0, rate: 0 },
    { loyaltyUntil: now, days: 0, rate: 0 },
    { loyaltyUntil: after(10, 120), days: 11, rate: 5 },
    { loyaltyUntil: after(30), days: 30, rate: 5 },
    { loyaltyUntil: after(30, 1), days: 31, rate: 10 },
    { loyaltyUntil: after(180), days: 180, rate: 10 },
    { loyaltyUntil: after(180, 1), days: 181, rate: 20 },
    { loyaltyUntil: after(200), days: 200, rate: 20 },
  ])('faltam $days dias e a multa é $rate%', ({ loyaltyUntil, days, rate }) => {
    const remaining = calculateRemainingDays(loyaltyUntil, now);
    expect(remaining).toBe(days);
    expect(penaltyRateFor(remaining)).toBe(rate);
  });

  it('arredonda para cima 116 dias, 17 horas e 35 minutos', () => {
    const until = after(116, 17 * 60 + 35);
    expect(calculateRemainingDays(until, now)).toBe(117);
  });
});

describe('calculateCommission (RN16)', () => {
  it.each([
    { profit: 300, expected: 30 },
    { profit: 385, expected: 39 },
    { profit: 1000, expected: 100 },
    { profit: 1001, expected: 100 },
    { profit: 1500, expected: 200 },
    { profit: -750, expected: 0 },
    { profit: 0, expected: 0 },
  ])('lucro $profit paga comissão $expected', ({ profit, expected }) => {
    expect(calculateCommission(profit)).toBe(expected);
  });
});

describe('settleSale (RN15 e RN16)', () => {
  it.each([
    {
      purchaseValue: 3700,
      marketValue: 4000,
      days: 117,
      penalty: 400,
      commission: 30,
      credit: 3570,
    },
    {
      purchaseValue: 5000,
      marketValue: 4250,
      days: 200,
      penalty: 850,
      commission: 0,
      credit: 3400,
    },
    {
      purchaseValue: 2615,
      marketValue: 3000,
      days: 20,
      penalty: 150,
      commission: 39,
      credit: 2811,
    },
    {
      purchaseValue: 2500,
      marketValue: 2500,
      days: 0,
      penalty: 0,
      commission: 0,
      credit: 2500,
    },
    {
      purchaseValue: 6000,
      marketValue: 7500,
      days: 300,
      penalty: 1000,
      commission: 200,
      credit: 6300,
    },
  ])(
    'compra $purchaseValue e venda $marketValue gera crédito $credit',
    ({ purchaseValue, marketValue, days, penalty, commission, credit }) => {
      const settlement = settleSale({
        marketValue,
        purchaseValue,
        remainingDays: days,
      });
      expect(settlement.penalty).toBe(penalty);
      expect(settlement.commission).toBe(commission);
      expect(settlement.credit).toBe(credit);
    },
  );

  it('encerra o contrato sem multa e rescinde com multa', () => {
    expect(
      settleSale({ marketValue: 2500, purchaseValue: 2500, remainingDays: 0 })
        .contractStatus,
    ).toBe('ENCERRADO');
    expect(
      settleSale({ marketValue: 2500, purchaseValue: 2500, remainingDays: 5 })
        .contractStatus,
    ).toBe('RESCINDIDO');
  });
});
