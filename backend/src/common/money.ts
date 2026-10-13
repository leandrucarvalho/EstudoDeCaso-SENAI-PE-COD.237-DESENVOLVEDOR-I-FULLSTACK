/**
 * Valores em moedas são calculados em centavos inteiros: assim não há erro de ponto flutuante
 * e o arredondamento do enunciado ("para longe do zero, uma única vez, no resultado final")
 * fica exato.
 */
export type Cents = number;

export function toCents(
  value: { toString(): string } | number | string,
): Cents {
  return Math.round(Number(value.toString()) * 100);
}

export function fromCents(cents: Cents): number {
  return cents / 100;
}

/** Representação decimal exata para gravar em colunas DECIMAL. */
export function toDecimalString(cents: Cents): string {
  return (cents / 100).toFixed(2);
}

/**
 * Divisão inteira arredondada com o meio para longe do zero.
 * Os cálculos de moeda do enunciado só arredondam valores não negativos.
 */
export function divideRound(numerator: number, denominator: number): number {
  return Math.floor((2 * numerator + denominator) / (2 * denominator));
}

/** Formato do CSV (RN18): duas casas, vírgula decimal e sinal "-" para negativos. */
export function formatCsvMoney(cents: Cents): string {
  const sign = cents < 0 ? '-' : '';
  const absolute = Math.abs(cents);
  const integerPart = Math.floor(absolute / 100);
  const decimalPart = String(absolute % 100).padStart(2, '0');
  return `${sign}${integerPart},${decimalPart}`;
}
