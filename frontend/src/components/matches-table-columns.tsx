import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { Column } from "@/components/DataTable";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/format";
import { RESULT_LABELS } from "@/lib/match-view";
import { cn } from "@/lib/utils";
import type { MatchSummary } from "@/types/league";

/** Quem ganhou aparece em negrito; no empate, nenhum. */
export function buildMatchColumns(
  acronyms: Map<number, string>,
): Column<MatchSummary>[] {
  const acronymOf = (id: number, name: string) =>
    acronyms.get(id) ?? name.slice(0, 3).toUpperCase();

  return [
    {
      header: "Data e hora",
      cell: (match) => {
        const [date, time] = formatDateTime(match.played_at).split(" ");
        return (
          <span className="tabular-nums">
            {date} <span className="text-muted-foreground">{time}</span>
          </span>
        );
      },
    },
    {
      header: "Mandante",
      cell: (match) => (
        <span
          className={cn(
            "flex items-center justify-end gap-2",
            match.result === "MANDANTE" && "font-semibold",
          )}
        >
          {match.home.club_name}
          <Badge variant="secondary">
            {acronymOf(match.home.club_id, match.home.club_name)}
          </Badge>
        </span>
      ),
      className: "text-right",
    },
    {
      header: "Placar",
      cell: (match) => (
        <span className="rounded-md bg-muted px-2 py-1 font-semibold tabular-nums">
          {match.home.goals} × {match.away.goals}
        </span>
      ),
      className: "text-center",
    },
    {
      header: "Visitante",
      cell: (match) => (
        <span
          className={cn(
            "flex items-center gap-2",
            match.result === "VISITANTE" && "font-semibold",
          )}
        >
          <Badge variant="secondary">
            {acronymOf(match.away.club_id, match.away.club_name)}
          </Badge>
          {match.away.club_name}
        </span>
      ),
    },
    {
      header: "Resultado",
      cell: (match) => (
        <Badge variant="outline">{RESULT_LABELS[match.result]}</Badge>
      ),
    },
    {
      header: "Duelos",
      srOnlyHeader: true,
      cell: (match) => (
        <Link
          to={`/partidas/${match.id}`}
          className="inline-flex items-center gap-1 font-medium hover:underline"
        >
          Ver duelos
          <ChevronRight aria-hidden className="size-4" />
        </Link>
      ),
      className: "text-right",
    },
  ];
}
