import { ArrowUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ClubSort } from "@/types/club";

// Limite da liga (RN10), só para mostrar "6 de 20"; quem recusa o 21º é a API.
const MAX_CLUBS = 20;

const SORT_LABELS: Record<ClubSort, string> = {
  name: "nome",
  net_worth_desc: "patrimônio (maior para o menor)",
  net_worth_asc: "patrimônio (menor para o maior)",
};

interface ClubsListHeaderProps {
  total: number | null;
  sort: ClubSort;
  onSortChange: (sort: ClubSort) => void;
}

export function ClubsListHeader({
  total,
  sort,
  onSortChange,
}: ClubsListHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="flex items-center gap-2 text-sm">
        {total !== null && (
          <>
            <span className="font-semibold">
              {total} {total === 1 ? "clube" : "clubes"}
            </span>
            <Badge variant="secondary">
              {total} de {MAX_CLUBS}
            </Badge>
          </>
        )}
      </p>

      <Select
        value={sort}
        onValueChange={(value) => onSortChange(value as ClubSort)}
      >
        <SelectTrigger
          aria-label="Ordenar por"
          className="h-9 w-[320px] gap-2 rounded-[8px] border border-input bg-background px-3 text-sm [&>[data-slot=select-value]]:mr-auto"
        >
          <ArrowUpDown className="size-4 shrink-0 text-muted-foreground" />
          <span className="text-muted-foreground">Ordenar:</span>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(SORT_LABELS).map(([value, label]) => (
            <SelectItem key={value} value={value} className="h-8">
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}