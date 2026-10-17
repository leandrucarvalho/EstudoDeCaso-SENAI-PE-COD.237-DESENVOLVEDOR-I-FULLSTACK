import {
  BadgePercent,
  HandCoins,
  ShoppingCart,
  TrendingUp,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import { formatMoney, formatSignedMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { TransactionsSummary } from "@/types/market";

interface Item {
  icon: LucideIcon;
  label: string;
  value: string;
  caption: string;
  color?: string;
}

/** Totais do `summary` da API (já respeitam os filtros); nada é somado aqui. */
export function TransactionsSummaryBar({
  summary,
}: {
  summary: TransactionsSummary;
}) {
  const items: Item[] = [
    {
      icon: ShoppingCart,
      label: "Total pago em compras",
      value: formatMoney(summary.total_spent),
      caption: "Valor + taxa",
    },
    {
      icon: HandCoins,
      label: "Total recebido em vendas",
      value: formatMoney(summary.total_received),
      caption: "Crédito líquido",
    },
    {
      icon: BadgePercent,
      label: "Taxas e comissões",
      value: formatMoney(summary.total_fees),
      caption: "Somadas",
    },
    {
      icon: TriangleAlert,
      label: "Multas",
      value: formatMoney(summary.total_penalties),
      caption: "Por fidelidade",
    },
    {
      icon: TrendingUp,
      label: "Lucro total",
      value: formatSignedMoney(summary.total_profit),
      caption: "Soma dos lucros, com sinal",
      color:
        summary.total_profit === 0
          ? undefined
          : summary.total_profit > 0
            ? "text-success-soft-foreground"
            : "text-destructive-soft-foreground",
    },
  ];

  return (
    <dl className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-5">
      {items.map(({ icon: Icon, label, value, caption, color }) => (
        <div key={label} className="bg-muted-subtle p-4">
          <dt className="flex items-center gap-2 text-xs text-muted-foreground">
            <Icon aria-hidden className="size-4" />
            {label}
          </dt>
          <dd className={cn("mt-1 text-lg font-semibold tabular-nums", color)}>
            {value}
          </dd>
          <dd className="text-xs text-muted-foreground">{caption}</dd>
        </div>
      ))}
    </dl>
  );
}
