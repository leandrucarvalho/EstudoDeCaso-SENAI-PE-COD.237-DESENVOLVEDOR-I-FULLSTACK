import { HandCoins, ShoppingCart } from "lucide-react";
import type { Column } from "@/components/DataTable";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { Badge } from "@/components/ui/badge";
import {
  EMPTY,
  formatDateTime,
  formatMoney,
  formatSignedMoney,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Transaction } from "@/types/market";

/** Verde para positivo, vermelho para negativo; zero e vazio ficam neutros. */
function signColor(value: number | null): string | undefined {
  if (value == null || value === 0) return undefined;
  return value > 0
    ? "text-success-soft-foreground"
    : "text-destructive-soft-foreground";
}

/** "dd/mm/aaaa hh:mm" em duas partes: a hora fica em cinza. */
function splitDateTime(iso: string): [string, string] {
  const [date, time] = formatDateTime(iso).split(" ");
  return [date, time];
}

/** Tudo vem da API; a tela só formata e escolhe a cor do sinal. */
export const TRANSACTION_COLUMNS: Column<Transaction>[] = [
  {
    header: "Data e hora",
    cell: (transaction) => {
      const [date, time] = splitDateTime(transaction.created_at);
      return (
        <span className="tabular-nums">
          {date} <span className="text-muted-foreground">{time}</span>
        </span>
      );
    },
  },
  {
    header: "Tipo",
    cell: (transaction) => (
      <Badge variant="outline">
        {transaction.type === "COMPRA" ? (
          <ShoppingCart aria-hidden />
        ) : (
          <HandCoins aria-hidden />
        )}
        {transaction.type === "COMPRA" ? "Compra" : "Venda"}
      </Badge>
    ),
  },
  {
    header: "Jogador",
    cell: (transaction) => (
      <div className="flex items-center gap-3">
        <PlayerAvatar name={transaction.player_name} />
        <span className="font-medium">{transaction.player_name}</span>
      </div>
    ),
  },
  {
    header: "Valor",
    cell: (transaction) => formatMoney(transaction.value),
    className: "text-right tabular-nums",
  },
  {
    header: "Taxa ou comissão",
    cell: (transaction) => formatMoney(transaction.fee),
    className: "text-right tabular-nums",
  },
  {
    header: "Multa",
    cell: (transaction) => formatMoney(transaction.penalty),
    className: "text-right tabular-nums text-muted-foreground",
  },
  {
    header: "Lucro",
    cell: (transaction) => (
      <span className={cn(signColor(transaction.profit))}>
        {transaction.profit == null
          ? EMPTY
          : formatSignedMoney(transaction.profit)}
      </span>
    ),
    className: "text-right tabular-nums",
  },
  {
    header: "Variação do caixa",
    cell: (transaction) => (
      <span className={cn("font-semibold", signColor(transaction.cash_change))}>
        {formatSignedMoney(transaction.cash_change)}
      </span>
    ),
    className: "text-right tabular-nums",
  },
];
