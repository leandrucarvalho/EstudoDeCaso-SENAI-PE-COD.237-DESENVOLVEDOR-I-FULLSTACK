import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowUpDown } from "lucide-react";
import type { PlayerCounts } from "@/hooks/usePlayerCounts";
import type { PlayersScope, PlayersView } from "@/lib/players-view";
import type { PlayerSort } from "@/types/player";

const SORT_LABELS: Record<PlayerSort, string> = {
  name: "nome",
  value_desc: "maior valor",
  value_asc: "menor valor",
  age_asc: "mais novos",
  age_desc: "mais velhos",
  position: "posição",
};

const TABS: { value: PlayersScope; label: string; key: keyof PlayerCounts }[] =
  [
    { value: "all", label: "Todos", key: "all" },
    { value: "free", label: "Livres", key: "free" },
    { value: "club", label: "Em clubes", key: "club" },
  ];

interface PlayersListHeaderProps {
  view: PlayersView;
  counts: PlayerCounts | null;
  onChange: (patch: Partial<PlayersView>) => void;
}

export function PlayersListHeader({
  view,
  counts,
  onChange,
}: PlayersListHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Tabs
        value={view.scope}
        onValueChange={(value) => onChange({ scope: value as PlayersScope })}
      >
        <TabsList>
          {TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
              {counts && (
                <span className="tabular-nums text-muted-foreground">
                  {counts[tab.key]}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Select
        value={view.sort}
        onValueChange={(value) => onChange({ sort: value as PlayerSort })}
      >
        <SelectTrigger
          aria-label="Ordenar por"
          className="w-[284px] h-9 md:h-10 rounded-[8px] border border-input bg-background px-3 text-sm md:text-base shadow-[0px_1px_2px_0px_#0000000D] [&>[data-slot=select-value]]:mr-auto gap-2"
        >
          <ArrowUpDown className="size-4 text-muted-foreground shrink-0" />
          <span className="text-muted-foreground">Ordenar:</span>
          <SelectValue placeholder="valor" />
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
