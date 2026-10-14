import { API_URL, request } from '../lib/http';
import { buildQueryString } from '../lib/query';
import type {
  BuyInput,
  BuyResult,
  SellResult,
  TransactionFilters,
  TransactionsPage,
} from '../types/market';

export function buyPlayer(playerId: number, input: BuyInput): Promise<BuyResult> {
  return request<BuyResult>(`/players/${playerId}/buy`, {
    method: 'POST',
    body: input,
  });
}

export function sellPlayer(playerId: number): Promise<SellResult> {
  return request<SellResult>(`/players/${playerId}/sell`, { method: 'POST' });
}

export function listTransactions(
  clubId: number,
  filters: TransactionFilters = {},
): Promise<TransactionsPage> {
  return request<TransactionsPage>(
    `/clubs/${clubId}/transactions${buildQueryString(filters)}`,
  );
}

/** O CSV não é JSON: a tela abre esta URL e o navegador baixa o arquivo. */
export function transactionsExportUrl(
  clubId: number,
  filters: TransactionFilters = {},
): string {
  return `${API_URL}/clubs/${clubId}/transactions/export${buildQueryString(filters)}`;
}