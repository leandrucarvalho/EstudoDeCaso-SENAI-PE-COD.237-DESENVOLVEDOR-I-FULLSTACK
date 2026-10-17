import { ArrowLeft, HeartPulse, SearchX, Volleyball } from "lucide-react";
import { useCallback, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { DuelsTable } from "@/components/DuelsTable";
import { MatchPitch } from "@/components/MatchPitch";
import { ScoreBoard } from "@/components/ScoreBoard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAsync } from "@/hooks/useAsync";
import { useSetCrumbLabel } from "@/lib/crumb-label";
import { ApiError } from "@/lib/http";
import { listClubs } from "@/services/clubs";
import { getMatch } from "@/services/league";

function BackLink() {
  return (
    <Button asChild variant="ghost" className="mb-4 -ml-3">
      <Link to="/partidas">
        <ArrowLeft aria-hidden />
        Voltar para partidas
      </Link>
    </Button>
  );
}

export function MatchDetailPage() {
  const { matchId } = useParams();
  const id = Number(matchId);
  const validId = Number.isInteger(id) && id > 0;

  // 404 vira `null` ("não existe"); qualquer outro erro continua sendo erro.
  const fetchMatch = useCallback(async () => {
    if (!validId) return null;
    try {
      return await getMatch(id);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  }, [id, validId]);
  const { data: match, error, loading, reload } = useAsync(fetchMatch);
  // `listClubs` é uma função do módulo (referência estável).
  const { data: clubs } = useAsync(listClubs);
  useSetCrumbLabel(
    match &&
      `${match.home.club_name} ${match.home.goals} × ${match.away.goals} ${match.away.club_name}`,
  );
  const acronyms = useMemo(
    () => new Map((clubs ?? []).map((item) => [item.id, item.acronym])),
    [clubs],
  );

  if (loading) {
    return (
      <div aria-busy className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-40" />
        <Skeleton className="h-72" />
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

  if (!match) {
    return (
      <div className="flex flex-col items-center rounded-xl border bg-card px-6 py-14 text-center">
        <div className="flex size-14 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <SearchX aria-hidden className="size-6" />
        </div>
        <h1 className="mt-4 text-lg font-semibold">Partida não encontrada</h1>
        <p className="mt-1 max-w-sm text-muted-foreground">
          O endereço pode estar errado ou a partida não existe.
        </p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/partidas">
            <ArrowLeft aria-hidden />
            Voltar para partidas
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BackLink />

      <section aria-label="Placar" className="rounded-xl border bg-card">
        <ScoreBoard match={match} acronyms={acronyms} showFormation />
      </section>

      <section className="rounded-xl border bg-card">
        <header className="flex flex-wrap items-start justify-between gap-3 p-4">
          <div>
            <h2 className="font-semibold">Em campo</h2>
            <p className="text-sm text-muted-foreground">
              Titulares de cada clube na formação da partida e os valores usados
              nos duelos, já com o efeito da condição.
            </p>
          </div>
          <ul className="flex items-center gap-4 text-sm text-muted-foreground">
            <li className="flex items-center gap-1.5">
              <HeartPulse aria-hidden className="size-4 text-amber-600" />
              Mal condicionado
            </li>
            <li className="flex items-center gap-1.5">
              <Volleyball aria-hidden className="size-4" />
              Gol no duelo
            </li>
          </ul>
        </header>
        <div className="p-4 pt-0">
          <MatchPitch match={match} />
        </div>
      </section>

      <DuelsTable match={match} />
    </div>
  );
}
