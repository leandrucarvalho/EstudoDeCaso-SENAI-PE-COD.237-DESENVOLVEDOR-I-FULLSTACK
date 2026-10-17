import {
  ArrowLeft,
  Banknote,
  Landmark,
  SearchX,
  Shirt,
  Wallet,
  ShoppingCart,
  History,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ClubAvatar } from "@/components/ClubAvatar";
import { DataTable } from "@/components/DataTable";
import { buildSquadColumns } from "@/components/squad-table-columns";
import { StatCard } from "@/components/StatCard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAsync } from "@/hooks/useAsync";
import { formatMoney } from "@/lib/format";
import { ApiError } from "@/lib/http";
import { getClub } from "@/services/clubs";
import { SellPlayerDialog } from "@/components/SellPlayerDialog";
import type { SquadPlayer } from "@/types/club";
import { TransactionsPanel } from "@/components/TransactionsPanel";

// Limite do elenco (RN12), só para mostrar "6 de 12"; quem recusa o 13º é a API.
const MAX_SQUAD_SIZE = 12;

function ClubNotFound() {
  return (
    <div className="flex flex-col items-center rounded-xl border bg-card px-6 py-14 text-center">
      <div className="flex size-14 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        <SearchX aria-hidden className="size-6" />
      </div>
      <h1 className="mt-4 text-lg font-semibold">Clube não encontrado</h1>
      <p className="mt-1 max-w-sm text-muted-foreground">
        O endereço pode estar errado ou o clube não existe.
      </p>
      <Button asChild variant="outline" className="mt-4">
        <Link to="/clubes">
          <ArrowLeft aria-hidden />
          Voltar para clubes
        </Link>
      </Button>
    </div>
  );
}

export function ClubDetailPage() {
  const { clubId } = useParams();
  const id = Number(clubId);
  const validId = Number.isInteger(id) && id > 0;

  // 404 vira `null` ("não existe"); qualquer outro erro continua sendo erro.
  const fetchClub = useCallback(async () => {
    if (!validId) return null;
    try {
      return await getClub(id);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  }, [id, validId]);
  const { data: club, error, loading, reload } = useAsync(fetchClub);
  const [selling, setSelling] = useState<SquadPlayer | null>(null);
  const columns = useMemo(() => buildSquadColumns(setSelling), []);
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("aba") === "historico" ? "history" : "squad";

  if (loading) {
    return (
      <div aria-busy className="space-y-6">
        <Skeleton className="h-14 w-72" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-3">
        <Alert variant="destructive">
          <AlertTitle>Não foi possível carregar</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button variant="outline" onClick={reload}>
          Tentar de novo
        </Button>
      </div>
    );
  }

  if (!club) return <ClubNotFound />;

  const squadSize = club.players.length;

  return (
    <>
      <header className="mb-6 flex items-center gap-4">
        <ClubAvatar acronym={club.acronym} className="size-14 text-sm" />
        <div className="mr-auto">
          <h1 className="text-2xl font-semibold tracking-tight">{club.name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Badge variant="outline">Sigla {club.acronym}</Badge>
            <Badge variant="outline">
              <Shirt aria-hidden />
              {squadSize} de {MAX_SQUAD_SIZE} jogadores
            </Badge>
          </div>
        </div>
        <Button asChild>
          <Link to="/jogadores">
            <ShoppingCart aria-hidden />
            Comprar jogadores
          </Link>
        </Button>
      </header>

      <section
        aria-label="Resumo financeiro"
        className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <StatCard
          icon={Wallet}
          label="Caixa"
          value={formatMoney(club.cash)}
          unit="moedas"
          caption="Só muda por compras e vendas"
        />
        <StatCard
          icon={Banknote}
          label="Valor do elenco"
          value={formatMoney(club.squad_value)}
          unit="moedas"
          caption="Soma dos valores de mercado"
        />
        <StatCard
          icon={Landmark}
          label="Patrimônio"
          value={formatMoney(club.net_worth)}
          unit="moedas"
          caption="Caixa + valor do elenco"
        />
        <StatCard
          icon={Shirt}
          label="Elenco"
          value={`${squadSize} de ${MAX_SQUAD_SIZE}`}
          caption={`Limite de ${MAX_SQUAD_SIZE} jogadores`}
        />
      </section>

      <Tabs
        value={tab}
        onValueChange={(value) =>
          setSearchParams(value === "history" ? { aba: "historico" } : {})
        }
      >
        <TabsList variant="line">
          <TabsTrigger value="squad">
            <Shirt aria-hidden />
            Elenco
            <span className="tabular-nums text-muted-foreground">
              {squadSize}
            </span>
          </TabsTrigger>
          <TabsTrigger value="history">
            <History aria-hidden />
            Histórico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="squad" className="mt-2">
          <DataTable
            columns={columns}
            rows={club.players}
            getRowKey={(player) => player.id}
            toolbar={
              <div>
                <h2 className="font-semibold">Elenco</h2>
                <p className="text-sm text-muted-foreground">
                  Ordem por posição (GOL, ZAG, LAT, MEI, ATA), depois pelo nome.
                  Contrato calculado para uma venda agora.
                </p>
              </div>
            }
            emptyMessage="Este clube ainda não tem jogadores."
          />
        </TabsContent>

        <TabsContent value="history" className="mt-2">
          <TransactionsPanel clubId={club.id} />
        </TabsContent>
      </Tabs>

      <p className="mt-4 text-sm text-muted-foreground">
        Valor de mercado, dias restantes e % de multa são calculados para uma
        venda agora. A multa tem teto de 10,00.
      </p>
      {selling && (
        <SellPlayerDialog
          player={selling}
          club={club}
          onClose={() => setSelling(null)}
          onSold={reload}
        />
      )}
    </>
  );
}
