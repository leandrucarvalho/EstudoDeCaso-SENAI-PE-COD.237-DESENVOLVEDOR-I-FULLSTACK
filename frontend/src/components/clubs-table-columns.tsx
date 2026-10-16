import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { ClubAvatar } from "@/components/ClubAvatar";
import type { Column } from "@/components/DataTable";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/format";
import type { Club } from "@/types/club";

export const CLUB_COLUMNS: Column<Club>[] = [
  {
    header: "Clube",
    cell: (club) => (
      <div className="flex items-center gap-3">
        <ClubAvatar acronym={club.acronym} />
        <Link
          to={`/clubes/${club.id}`}
          className="font-medium hover:text-primary hover:underline"
        >
          {club.name}
        </Link>
      </div>
    ),
  },
  {
    header: "Sigla",
    cell: (club) => <Badge variant="outline">{club.acronym}</Badge>,
  },
  {
    header: "Caixa",
    cell: (club) => formatMoney(club.cash),
    className: "text-right tabular-nums",
  },
  {
    header: "Valor do elenco",
    cell: (club) => formatMoney(club.squad_value),
    className: "text-right tabular-nums",
  },
  {
    header: "Patrimônio",
    cell: (club) => formatMoney(club.net_worth),
    className: "text-right font-semibold tabular-nums",
  },
  {
    header: "Ver clube",
    srOnlyHeader: true,
    cell: (club) => (
      <Link
        to={`/clubes/${club.id}`}
        className="inline-flex items-center gap-1 text-sm font-medium hover:text-primary"
      >
        Ver clube
        <ChevronRight aria-hidden className="size-4" />
      </Link>
    ),
    className: "w-32 text-right",
  },
];