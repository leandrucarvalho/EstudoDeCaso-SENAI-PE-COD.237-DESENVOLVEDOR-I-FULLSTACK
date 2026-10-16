import { ConditionBadge } from "@/components/ConditionBadge";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatMoney } from "@/lib/format";
import { ATTRIBUTE_FIELDS, ATTRIBUTE_LABELS } from "@/lib/player-form";
import { POSITION_LABELS } from "@/lib/player-labels";
import type { Club } from "@/types/club";
import type { Player } from "@/types/player";

interface PlayerDetailsDialogProps {
  player: Player;
  club: Club | undefined;
  onClose: () => void;
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border p-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-lg font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

/** Mostra só o que a API devolveu; nenhum valor é recalculado aqui. */
export function PlayerDetailsDialog({
  player,
  club,
  onClose,
}: PlayerDetailsDialogProps) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="p-6 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="sr-only">
            Detalhes de {player.name}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Valores, overall e indicadores do jogador.
          </DialogDescription>
          <div className="flex items-center gap-3">
            <PlayerAvatar name={player.name} className="size-12" />
            <div className="mr-auto">
              <p className="text-lg leading-tight font-semibold">
                {player.name}
              </p>
              <p className="text-sm text-muted-foreground">
                {player.position} · {POSITION_LABELS[player.position]} ·{" "}
                {player.age} anos
              </p>
            </div>
            <ConditionBadge condition={player.condition} />
          </div>
        </DialogHeader>

        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Stat label="Overall" value={player.overall} />
          <Stat label="Valor base" value={formatMoney(player.base_value)} />
          <Stat
            label="Valor de mercado"
            value={formatMoney(player.market_value)}
          />
          <Stat label="Agilidade" value={player.agility} />
          <Stat label="Potencial" value={player.potential} />
          <div className="rounded-lg border p-3">
            <dt className="text-xs text-muted-foreground">Clube</dt>
            <dd className="mt-1">
              {club ? (
                <Badge variant="secondary">
                  {club.acronym} · {club.name}
                </Badge>
              ) : (
                <Badge variant="secondary">Livre</Badge>
              )}
            </dd>
          </div>
        </dl>

        <section aria-label="Indicadores técnicos">
          <h3 className="mb-2 text-sm font-medium">Indicadores técnicos</h3>
          <ul className="space-y-2">
            {ATTRIBUTE_FIELDS.map((field) => (
              <li key={field} className="flex items-center gap-2 text-xs">
                <span className="w-24 shrink-0 text-muted-foreground">
                  {ATTRIBUTE_LABELS[field]}
                </span>
                <div aria-hidden className="h-1.5 flex-1 rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${player[field]}%` }}
                  />
                </div>
                <span className="w-6 text-right font-semibold tabular-nums">
                  {player[field]}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <DialogFooter className="sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}