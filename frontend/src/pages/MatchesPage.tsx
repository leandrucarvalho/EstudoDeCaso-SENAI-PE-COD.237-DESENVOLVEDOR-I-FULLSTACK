import { ChevronRight, Plus, Shield, Swords } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { DataTable } from "@/components/DataTable";
import { buildMatchColumns } from "@/components/matches-table-columns";
import { NewMatchDialog } from "@/components/NewMatchDialog";
import { PageHeader } from "@/components/PageHeader";
import { ScoreBoard } from "@/components/ScoreBoard";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAsync } from "@/hooks/useAsync";
import { listClubs } from "@/services/clubs";
import { listMatches } from "@/services/league";

const ALL_CLUBS = "ALL";

export function MatchesPage() {
  const [club, setClub] = useState(ALL_CLUBS);
  const [creating, setCreating] = useState(false);

  const fetchMatches = useCallback(
    () => listMatches(club === ALL_CLUBS ? undefined : Number(club)),
    [club],
  );
  const { data: matches, error, loading, reload } = useAsync(fetchMatches);
  // `listClubs` é uma função do módulo (referência estável).
  const { data: clubs } = useAsync(listClubs);

  const acronyms = useMemo(
    () => new Map((clubs ?? []).map((item) => [item.id, item.acronym])),
    [clubs],
  );
  const columns = useMemo(() => buildMatchColumns(acronyms), [acronyms]);
  const latest = matches?.[0];

  return (
    <>
      <PageHeader
        icon={Swords}
        title="Partidas"
        description="Jogue partidas entre clubes com os 5 titulares escalados e acompanhe o histórico."
        action={
          <Button onClick={() => setCreating(true)} disabled={!clubs}>
            <Plus aria-hidden />
            Nova partida
          </Button>
        }
      />

      {latest && (
        <section aria-label="Última partida" className="mb-6">
          <h2 className="mb-2 text-sm text-muted-foreground">Última partida</h2>
          <div className="relative rounded-xl border bg-card">
            <ScoreBoard match={latest} acronyms={acronyms} />
            <Button
              variant="outline"
              asChild
              className="absolute top-1/2 right-4 -translate-y-1/2"
            >
              <Link to={`/partidas/${latest.id}`}>
                Ver duelos
                <ChevronRight aria-hidden />
              </Link>
            </Button>
          </div>
        </section>
      )}

      <DataTable
        columns={columns}
        rows={matches ?? []}
        getRowKey={(match) => match.id}
        loading={loading}
        error={error}
        onRetry={reload}
        toolbar={
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">Histórico de partidas</h2>
              <p className="text-sm text-muted-foreground">
                Da mais recente para a mais antiga.
              </p>
            </div>
            <Select value={club} onValueChange={setClub}>
              <SelectTrigger
                aria-label="Filtrar por clube"
                className="w-52 [&>[data-slot=select-value]]:mr-auto"
              >
                <Shield aria-hidden className="text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_CLUBS}>Clube: todos</SelectItem>
                {(clubs ?? []).map((item) => (
                  <SelectItem key={item.id} value={String(item.id)}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
        errorTitle="Não foi possível carregar as partidas"
        emptyTitle={
          club === ALL_CLUBS
            ? "Nenhuma partida jogada"
            : "Nenhuma partida deste clube"
        }
        emptyMessage={
          club === ALL_CLUBS
            ? "Escale os titulares de dois clubes e jogue a primeira partida."
            : "Este clube ainda não jogou partidas."
        }
        emptyAction={
          club === ALL_CLUBS ? (
            <Button
              variant="outline"
              disabled={!clubs}
              onClick={() => setCreating(true)}
            >
              Nova partida
            </Button>
          ) : undefined
        }
        footer={
          matches && matches.length > 0 ? (
            <p className="text-sm text-muted-foreground tabular-nums">
              {matches.length} {matches.length === 1 ? "partida" : "partidas"}
            </p>
          ) : undefined
        }
      />

      <p className="mt-4 text-sm text-muted-foreground">
        Da mais recente para a mais antiga, com filtro por clube. Ver duelos
        abre a partida.
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
