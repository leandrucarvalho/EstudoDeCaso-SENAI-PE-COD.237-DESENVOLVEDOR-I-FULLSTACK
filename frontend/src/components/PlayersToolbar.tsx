import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CONDITION_LABELS, POSITION_LABELS } from "@/lib/player-labels";
import {
  ALL,
  hasActiveFilters,
  type PlayersScope,
  type PlayersView,
} from "@/lib/players-view";
import type { PlayerSort } from "@/types/player";

const SORT_LABELS: Record<PlayerSort, string> = {
  name: "Nome (A a Z)",
  value_desc: "Maior valor",
  value_asc: "Menor valor",
  age_asc: "Mais novos",
  age_desc: "Mais velhos",
  position: "Posição",
};

interface PlayersToolbarProps {
  view: PlayersView;
  onChange: (patch: Partial<PlayersView>) => void;
  onClear: () => void;
}

export function PlayersToolbar({
  view,
  onChange,
  onClear,
}: PlayersToolbarProps) {
  return (
    <div className="mb-4 space-y-3">
      <Tabs
        value={view.scope}
        onValueChange={(value) => onChange({ scope: value as PlayersScope })}
      >
        <TabsList>
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="free">Livres</TabsTrigger>
          <TabsTrigger value="club">Em clubes</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex flex-wrap items-center gap-3">
        <Input
          aria-label="Buscar jogador"
          placeholder="Buscar por nome"
          value={view.search}
          onChange={(event) => onChange({ search: event.target.value })}
          className="w-full sm:w-64"
        />

        <Select
          value={view.position}
          onValueChange={(value) =>
            onChange({ position: value as PlayersView["position"] })
          }
        >
          <SelectTrigger aria-label="Filtrar por posição" className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todas as posições</SelectItem>
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
          <SelectTrigger aria-label="Filtrar por condição" className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todas as condições</SelectItem>
            {Object.entries(CONDITION_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={view.sort}
          onValueChange={(value) => onChange({ sort: value as PlayerSort })}
        >
          <SelectTrigger aria-label="Ordenar por" className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(SORT_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters(view) && (
          <Button variant="ghost" onClick={onClear}>
            Limpar filtros
          </Button>
        )}
      </div>
    </div>
  );
}
