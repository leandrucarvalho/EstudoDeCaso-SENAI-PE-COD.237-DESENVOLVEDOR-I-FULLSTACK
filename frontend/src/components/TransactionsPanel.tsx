import { CircleAlert, Download, User } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { DataTable } from "@/components/DataTable";
import { TRANSACTION_COLUMNS } from "@/components/transactions-table-columns";
import { TransactionsSummaryBar } from "@/components/TransactionsSummaryBar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAsync } from "@/hooks/useAsync";
import { ApiError } from "@/lib/http";
import { cn } from "@/lib/utils";
import { listTransactions, transactionsExportUrl } from "@/services/market";
import type {
  TransactionFilters,
  TransactionsPage,
  TransactionType,
} from "@/types/market";

const ALL_PLAYERS = "ALL";
const ALL_TYPES: TransactionType[] = ["COMPRA", "VENDA"];
const TYPE_LABELS: Record<TransactionType, string> = {
  COMPRA: "Compra",
  VENDA: "Venda",
};

interface Loaded {
  page: TransactionsPage | null;
  /** Mensagem da API quando ela recusa o filtro (jogador inexistente: 404). */
  rejected: string | null;
}

export function TransactionsPanel({ clubId }: { clubId: number }) {
  const [types, setTypes] = useState<TransactionType[]>(ALL_TYPES);
  const [player, setPlayer] = useState(ALL_PLAYERS);
  const [exporting, setExporting] = useState(false);

  // Os dois tipos marcados equivalem a "sem filtro de tipo".
  const filters = useMemo<TransactionFilters>(
    () => ({
      type: types.length === ALL_TYPES.length ? undefined : types,
      player_id: player === ALL_PLAYERS ? undefined : Number(player),
    }),
    [types, player],
  );
  const filtered =
    filters.type !== undefined || filters.player_id !== undefined;

  const fetchTransactions = useCallback(async (): Promise<Loaded> => {
    try {
      return { page: await listTransactions(clubId, filters), rejected: null };
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return { page: null, rejected: error.message };
      }
      throw error;
    }
  }, [clubId, filters]);
  const { data, error, loading, reload } = useAsync(fetchTransactions);

  // Opções do filtro de jogador: vêm da consulta sem filtros.
  const fetchEverything = useCallback(() => listTransactions(clubId), [clubId]);
  const { data: everything } = useAsync(fetchEverything);
  const players = useMemo(
    () =>
      [
        ...new Map(
          (everything?.data ?? []).map((item) => [
            item.player_id,
            item.player_name,
          ]),
        ),
      ].sort((a, b) => a[1].localeCompare(b[1], "pt-BR")),
    [everything],
  );

  function toggleType(type: TransactionType) {
    setTypes((current) => {
      if (!current.includes(type)) return [...current, type];
      // Pelo menos um tipo fica marcado.
      return current.length === 1 ? current : current.filter((t) => t !== type);
    });
  }

  function clearFilters() {
    setTypes(ALL_TYPES);
    setPlayer(ALL_PLAYERS);
  }

  async function exportCsv() {
    if (exporting) return;
    setExporting(true);

    try {
      const response = await fetch(transactionsExportUrl(clubId, filters));
      if (!response.ok) throw new Error("Não foi possível exportar o CSV.");

      const link = document.createElement("a");
      link.href = URL.createObjectURL(await response.blob());
      link.download = `historico-clube-${clubId}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);

      toast.success("CSV baixado", {
        description: `${link.download}${filtered ? ", com os filtros da tela aplicados." : "."}`,
      });
    } catch (failure) {
      // Erro fica na tela até ser fechado.
      toast.error("Não foi possível exportar", {
        description:
          failure instanceof Error ? failure.message : "Tente de novo.",
        duration: Infinity,
      });
    } finally {
      setExporting(false);
    }
  }

  const rejected = data?.rejected ?? null;
  const page = data?.page ?? null;

  return (
    <section className="rounded-xl border bg-card">
      <div className="flex flex-wrap items-start justify-between gap-3 p-4">
        <div>
          <h2 className="font-semibold">Histórico de transações</h2>
          <p className="text-sm text-muted-foreground">
            Da mais recente para a mais antiga, com o nome e os valores do
            momento de cada operação.
          </p>
        </div>
        <Button variant="outline" disabled={exporting} onClick={exportCsv}>
          <Download aria-hidden />
          Exportar CSV
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2 px-4 pb-4">
        <span className="text-sm text-muted-foreground">Tipo</span>
        {ALL_TYPES.map((type) => {
          const checked = types.includes(type);

          return (
            <button
              key={type}
              type="button"
              role="checkbox"
              aria-checked={checked}
              onClick={() => toggleType(type)}
              className={cn(
                "flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                checked
                  ? "border-primary bg-primary-soft text-primary"
                  : "border-input bg-background",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "flex size-4 items-center justify-center rounded-sm border text-[10px] text-primary-foreground",
                  checked ? "border-primary bg-primary" : "border-input",
                )}
              >
                {checked && "✓"}
              </span>
              {TYPE_LABELS[type]}
            </button>
          );
        })}

        <Select value={player} onValueChange={setPlayer}>
          <SelectTrigger
            aria-label="Filtrar por jogador"
            className="w-56 [&>[data-slot=select-value]]:mr-auto"
          >
            <User aria-hidden className="text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_PLAYERS}>Jogador: todos</SelectItem>
            {players.map(([id, name]) => (
              <SelectItem key={id} value={String(id)}>
                Jogador: {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {filtered && (
          <Button variant="link" onClick={clearFilters}>
            Limpar filtros
          </Button>
        )}
      </div>

      {rejected ? (
        <div className="border-t p-4">
          <Alert variant="destructive">
            <CircleAlert />
            <AlertTitle>O filtro foi recusado</AlertTitle>
            <AlertDescription>{rejected}</AlertDescription>
          </Alert>
        </div>
      ) : (
        <DataTable
          columns={TRANSACTION_COLUMNS}
          rows={page?.data ?? []}
          getRowKey={(transaction) => transaction.id}
          loading={loading}
          error={error}
          onRetry={reload}
          emptyMessage={
            filtered
              ? "Nenhuma transação com esses filtros."
              : "Nenhuma transação ainda. As compras e vendas do clube aparecem aqui."
          }
          emptyAction={
            filtered ? (
              <Button variant="outline" onClick={clearFilters}>
                Limpar filtros
              </Button>
            ) : undefined
          }
          footer={
            page ? <TransactionsSummaryBar summary={page.summary} /> : undefined
          }
        />
      )}

      <p className="border-t p-4 text-sm text-muted-foreground">
        Os totais respeitam os filtros. O CSV usa os mesmos filtros da tela.
      </p>
    </section>
  );
}
