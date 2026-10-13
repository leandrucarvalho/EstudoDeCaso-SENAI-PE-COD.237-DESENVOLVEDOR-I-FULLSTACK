import type { Transaction } from '../generated/prisma/client.js';
import { formatBrtDateTime } from '../common/brt-datetime.js';
import {
  type Cents,
  formatCsvMoney,
  fromCents,
  toCents,
} from '../common/money.js';

export interface TransactionResponse {
  id: number;
  club_id: number;
  player_id: number;
  player_name: string;
  type: Transaction['type'];
  value: number;
  fee: number;
  penalty: number;
  profit: number | null;
  cash_change: number;
  created_at: string;
}

export interface TransactionsSummary {
  total_spent: number;
  total_received: number;
  total_fees: number;
  total_penalties: number;
  total_profit: number;
}

export function toTransactionResponse(
  transaction: Transaction,
): TransactionResponse {
  return {
    id: transaction.id,
    club_id: transaction.clubId,
    player_id: transaction.playerId,
    player_name: transaction.playerName,
    type: transaction.type,
    value: fromCents(toCents(transaction.value)),
    fee: fromCents(toCents(transaction.fee)),
    penalty: fromCents(toCents(transaction.penalty)),
    profit:
      transaction.profit === null
        ? null
        : fromCents(toCents(transaction.profit)),
    cash_change: fromCents(toCents(transaction.cashChange)),
    created_at: formatBrtDateTime(transaction.createdAt),
  };
}

function sum(
  transactions: Transaction[],
  pick: (transaction: Transaction) => Cents,
): number {
  return fromCents(
    transactions.reduce((total, transaction) => total + pick(transaction), 0),
  );
}

/** RN17: totais sobre as transações já filtradas, com 2 casas. */
export function summarize(transactions: Transaction[]): TransactionsSummary {
  const purchases = transactions.filter(
    (transaction) => transaction.type === 'COMPRA',
  );
  const sales = transactions.filter(
    (transaction) => transaction.type === 'VENDA',
  );

  return {
    total_spent: sum(purchases, (t) => toCents(t.value) + toCents(t.fee)),
    total_received: sum(sales, (t) => toCents(t.cashChange)),
    total_fees: sum(transactions, (t) => toCents(t.fee)),
    total_penalties: sum(sales, (t) => toCents(t.penalty)),
    total_profit: sum(sales, (t) =>
      t.profit === null ? 0 : toCents(t.profit),
    ),
  };
}

const CSV_HEADER =
  'data_hora;tipo;jogador;valor;taxa_ou_comissao;multa;lucro;variacao_caixa';

/** Nome com `;` ou aspas vai entre aspas duplas, e cada aspa interna é duplicada. */
function csvText(text: string): string {
  return /[;"]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** RN18: UTF-8, separador `;`, vírgula decimal e cada linha terminada em LF. */
export function toCsv(transactions: Transaction[]): string {
  const lines = transactions.map((transaction) =>
    [
      formatBrtDateTime(transaction.createdAt),
      transaction.type,
      csvText(transaction.playerName),
      formatCsvMoney(toCents(transaction.value)),
      formatCsvMoney(toCents(transaction.fee)),
      formatCsvMoney(toCents(transaction.penalty)),
      transaction.profit === null
        ? ''
        : formatCsvMoney(toCents(transaction.profit)),
      formatCsvMoney(toCents(transaction.cashChange)),
    ].join(';'),
  );
  return [CSV_HEADER, ...lines].map((line) => `${line}\n`).join('');
}
