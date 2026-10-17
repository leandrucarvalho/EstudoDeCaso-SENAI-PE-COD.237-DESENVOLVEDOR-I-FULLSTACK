import { ListOrdered, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { DataTable } from "@/components/DataTable";
import { NewMatchDialog } from "@/components/NewMatchDialog";
import { PageHeader } from "@/components/PageHeader";
import { RecentMatches } from "@/components/RecentMatches";
import { buildStandingColumns } from "@/components/standings-table-columns";
import { Button } from "@/components/ui/button";
import { useAsync } from "@/hooks/useAsync";
import { listClubs } from "@/services/clubs";
import { listStandings } from "@/services/league";

// Só descreve a ordem; quem ordena é a API (RN21).
const CRITERIA = [
  "Mais pontos",
  "Maior saldo de gols",
  "Mais gols marcados",
  "Nome do clube, de A a Z",
];

export function StandingsPage() {
  const [creating, setCreating] = useState(false);

  // As duas funções vêm do módulo (referência estável).
  const { data: rows, error, loading, reload } = useAsync(listStandings);
  const { data: clubs } = useAsync(listClubs);

  const acronyms = useMemo(
    () => new Map((clubs ?? []).map((club) => [club.id, club.acronym])),
    [clubs],
  );
  const columns = useMemo(() => buildStandingColumns(acronyms), [acronyms]);

  return (
    <>
      <PageHeader
        icon={ListOrdered}
        title="Classificação"
        description="Todos os clubes, com 3 pontos por vitória e 1 por empate."
        action={
          <Button
            variant="outline"
            disabled={!clubs}
            onClick={() => setCreating(true)}
          >
            <Plus aria-hidden />
            Nova partida
          </Button>
        }
      />

      <div className="grid items-start gap-4 lg:grid-cols-[1fr_20rem]">
        <DataTable
          columns={columns}
          rows={rows ?? []}
          getRowKey={(row) => row.club_id}
          loading={loading}
          error={error}
          onRetry={reload}
          errorTitle="Não foi possível carregar a classificação"
          emptyTitle="Nenhum clube cadastrado"
          emptyMessage="A classificação mostra todos os clubes, mesmo os que ainda não jogaram."
          footer={
            <p className="text-sm text-muted-foreground">
              J: jogos · V: vitórias · E: empates · D: derrotas · GP: gols
              marcados · GC: gols sofridos · SG: saldo de gols · Pts: pontos
            </p>
          }
        />

        <div className="grid gap-4">
          <RecentMatches />

          <section className="rounded-xl border bg-card">
            <header className="border-b p-4">
              <h2 className="font-semibold">Ordem da tabela</h2>
              <p className="text-sm text-muted-foreground">
                Critérios de classificação, nesta ordem.
              </p>
            </header>
            <ol className="grid gap-3 p-4">
              {CRITERIA.map((criterion, index) => (
                <li key={criterion} className="flex items-center gap-3">
                  <span className="flex size-6 items-center justify-center rounded-full bg-muted text-xs font-medium">
                    {index + 1}
                  </span>
                  {criterion}
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>

      <p className="mt-4 text-sm text-muted-foreground">
        Todos os clubes aparecem, com os que ainda não jogaram zerados. Pontos,
        saldo e posição são calculados a cada consulta, nunca gravados (RN21).
      </p>

      {creating && clubs && (
        <NewMatchDialog
          clubs={clubs}
          onClose={() => setCreating(false)}
          onPlayed={reload}
        />
      )}
    </>
  );
}
