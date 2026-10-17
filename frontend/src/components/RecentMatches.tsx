import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAsync } from "@/hooks/useAsync";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { listMatches } from "@/services/league";

const LIMIT = 2;

/** As últimas partidas da liga, no lado da classificação. Tem os 3 estados. */
export function RecentMatches() {
  // `listMatches` é uma função do módulo (referência estável).
  const { data, error, loading, reload } = useAsync(listMatches);
  const matches = data?.slice(0, LIMIT) ?? [];

  return (
    <section className="rounded-xl border bg-card">
      <header className="border-b p-4">
        <h2 className="font-semibold">Últimas partidas</h2>
        <p className="text-sm text-muted-foreground">
          Da mais recente para a mais antiga.
        </p>
      </header>

      <div className="grid gap-4 p-4">
        {loading && (
          <div aria-busy className="grid gap-3">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        )}

        {!loading && error && (
          <div className="grid gap-2">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button variant="outline" onClick={reload}>
              Tentar de novo
            </Button>
          </div>
        )}

        {!loading && !error && matches.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nenhuma partida jogada ainda.
          </p>
        )}

        {!loading &&
          !error &&
          matches.map((match) => (
            <Link
              key={match.id}
              to={`/partidas/${match.id}`}
              className="grid gap-0.5 rounded-md hover:bg-muted"
            >
              <span className="text-xs text-muted-foreground tabular-nums">
                {formatDateTime(match.played_at).replace(" ", ", ")}
              </span>
              <span className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(match.result === "MANDANTE" && "font-semibold")}
                >
                  {match.home.club_name}
                </span>
                <span className="rounded-md bg-muted px-2 py-0.5 text-sm font-semibold tabular-nums">
                  {match.home.goals} × {match.away.goals}
                </span>
                <span
                  className={cn(
                    match.result === "VISITANTE" && "font-semibold",
                  )}
                >
                  {match.away.club_name}
                </span>
              </span>
            </Link>
          ))}

        <Button variant="link" asChild className="justify-start px-0">
          <Link to="/partidas">
            Ver todas as partidas
            <ArrowRight aria-hidden />
          </Link>
        </Button>
      </div>
    </section>
  );
}
