import { Link } from "react-router-dom";
import type { Column } from "@/components/DataTable";
import { Badge } from "@/components/ui/badge";
import { formatSignedInteger } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Standing } from "@/types/league";

/** Número da tabela: zero fica apagado para destacar quem já jogou. */
function number(value: number) {
  return (
    <span className={cn(value === 0 && "text-muted-foreground")}>{value}</span>
  );
}

/** Posição, saldo e pontos vêm da API (calculados a cada consulta). */
export function buildStandingColumns(
  acronyms: Map<number, string>,
): Column<Standing>[] {
  return [
    {
      header: "Pos.",
      cell: (row) => row.position,
      className: "w-12 text-muted-foreground tabular-nums",
    },
    {
      header: "Clube",
      cell: (row) => (
        <span className="flex items-center gap-2">
          <Badge variant="secondary">
            {acronyms.get(row.club_id) ??
              row.club_name.slice(0, 3).toUpperCase()}
          </Badge>
          <Link
            to={`/clubes/${row.club_id}`}
            className="font-medium underline-offset-4 hover:underline"
          >
            {row.club_name}
          </Link>
        </span>
      ),
    },
    {
      header: "J",
      cell: (row) => number(row.played),
      className: "text-right tabular-nums",
    },
    {
      header: "V",
      cell: (row) => number(row.wins),
      className: "text-right tabular-nums",
    },
    {
      header: "E",
      cell: (row) => number(row.draws),
      className: "text-right tabular-nums",
    },
    {
      header: "D",
      cell: (row) => number(row.losses),
      className: "text-right tabular-nums",
    },
    {
      header: "GP",
      cell: (row) => number(row.goals_for),
      className: "text-right tabular-nums",
    },
    {
      header: "GC",
      cell: (row) => number(row.goals_against),
      className: "text-right tabular-nums",
    },
    {
      header: "SG",
      cell: (row) => (
        <span
          className={cn(row.goal_difference === 0 && "text-muted-foreground")}
        >
          {formatSignedInteger(row.goal_difference)}
        </span>
      ),
      className: "text-right tabular-nums",
    },
    {
      header: "Pts",
      cell: (row) => (
        <span
          className={cn(
            "font-semibold",
            row.points === 0 && "text-muted-foreground",
          )}
        >
          {row.points}
        </span>
      ),
      className: "text-right tabular-nums",
    },
  ];
}
