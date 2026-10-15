import {
  Coins,
  HeartPulse,
  Search,
  Shield,
  Shirt,
  UserRound,
} from "lucide-react";
import { RangeFilter } from "@/components/RangeFilter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatMoney } from "@/lib/format";
import { CONDITION_LABELS, POSITION_LABELS } from "@/lib/player-labels";
import {
  ALL,
  VALUE_LIMITS,
  hasActiveFilters,
  type PlayersView,
} from "@/lib/players-view";
import type { Club } from "@/types/club";

const AGE_RANGES = [
  { value: "16-45", label: "Idade: 16 a 45" },
  { value: "18-30", label: "Idade: 18 a 30" },
  { value: "18-23", label: "Idade: 18 a 23" },
  { value: "24-29", label: "Idade: 24 a 29" },
  { value: "30-35", label: "Idade: 30 a 35" },
  { value: "36-45", label: "Idade: 36 a 45" },
] as const;

interface PlayersToolbarProps {
  view: PlayersView;
  clubs: Club[];
  onChange: (patch: Partial<PlayersView>) => void;
  onClear: () => void;
}

export function PlayersToolbar({
  view,
  clubs,
  onChange,
  onClear,
}: PlayersToolbarProps) {
  // Só é uma opção da lista quando as duas pontas batem com uma faixa pronta.
  const ageRange = `${view.minAge}-${view.maxAge}`;
  const ageValue = AGE_RANGES.some((range) => range.value === ageRange)
    ? ageRange
    : ALL;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border bg-card p-3">
      <div className="relative min-w-56 flex-1">
        <Search
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          aria-label="Buscar jogador"
          placeholder="Buscar por nome"
          value={view.search}
          onChange={(event) => onChange({ search: event.target.value })}
          className="h-9 pl-9 max-md:h-10"
        />
      </div>

      <Select
        value={view.position}
        onValueChange={(value) =>
          onChange({ position: value as PlayersView["position"] })
        }
      >
        <SelectTrigger
          aria-label="Filtrar por posição"
          className="w-40 [&>[data-slot=select-value]]:mr-auto"
        >
          <Shirt aria-hidden className="text-muted-foreground" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Posição</SelectItem>
          {Object.entries(POSITION_LABELS).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={view.condition}
        onValueChange={(value) =>
          onChange({ condition: value as PlayersView["condition"] })
        }
      >
        <SelectTrigger
          aria-label="Filtrar por condição"
          className="w-44 [&>[data-slot=select-value]]:mr-auto"
        >
          <HeartPulse aria-hidden className="text-muted-foreground" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Condição</SelectItem>
          {Object.entries(CONDITION_LABELS).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={view.club}
        disabled={view.scope === "free"}
        onValueChange={(value) => onChange({ club: value })}
      >
        <SelectTrigger
          aria-label="Filtrar por clube"
          title={
            view.scope === "free"
              ? "Jogadores livres não têm clube."
              : undefined
          }
          className="w-40 [&>[data-slot=select-value]]:mr-auto"
        >
          <Shield aria-hidden className="text-muted-foreground" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Clube</SelectItem>
          {clubs.map((club) => (
            <SelectItem key={club.id} value={String(club.id)}>
              {club.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={ageValue}
        onValueChange={(value) => {
          if (value === ALL) {
            onChange({ minAge: "", maxAge: "" });
            return;
          }
          const [minAge, maxAge] = value.split("-");
          onChange({ minAge, maxAge });
        }}
      >
        <SelectTrigger
          aria-label="Filtrar por idade"
          className="w-[164px] [&>[data-slot=select-value]]:mr-auto"
        >
          <UserRound aria-hidden className="text-muted-foreground" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Idade</SelectItem>
          {AGE_RANGES.map(({ value, label }) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <RangeFilter
        label="Valor de mercado"
        shortLabel="Valor"
        icon={Coins}
        minValue={view.minValue}
        maxValue={view.maxValue}
        limits={VALUE_LIMITS}
        formatValue={formatMoney}
        className="w-[204px]"
        onChange={(minValue, maxValue) => onChange({ minValue, maxValue })}
      />

      {hasActiveFilters(view) && (
        <Button variant="ghost" onClick={onClear}>
          Limpar filtros
        </Button>
      )}
    </div>
  );
}
