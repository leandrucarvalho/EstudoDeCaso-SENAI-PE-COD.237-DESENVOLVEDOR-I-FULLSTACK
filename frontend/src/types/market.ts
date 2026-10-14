export type TransactionType = 'COMPRA' | 'VENDA';

export interface Transaction {
  id: number;
  club_id: number;
  player_id: number;
  player_name: string;
  type: TransactionType;
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

export interface TransactionsPage {
  data: Transaction[];
  summary: TransactionsSummary;
}

export type TransactionFilters = {
  type?: TransactionType[];
  player_id?: number;
};

export interface BuyInput {
  club_id: number;
  /** AAAA-MM-DDTHH:MM-03:00 */
  loyalty_until: string;
}

export interface BuyResult extends Transaction {
  contract: {
    purchase_value: number;
    loyalty_until: string;
    status: 'ATIVO';
  };
  club_cash: number;
}

export interface SellResult extends Transaction {
  purchase_value: number;
  remaining_days: number;
  penalty_rate: number;
  contract_status: 'ENCERRADO' | 'RESCINDIDO';
  club_cash: number;
}