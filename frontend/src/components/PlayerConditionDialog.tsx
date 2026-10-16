import { Lock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ConditionBadge } from "@/components/ConditionBadge";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { CONDITION_LABELS, POSITION_LABELS } from "@/lib/player-labels";
import { cn } from "@/lib/utils";
import { changePlayerCondition } from "@/services/players";
import type { Condition, Player } from "@/types/player";

const OPTIONS: { value: Condition; description: string }[] = [
  { value: "APTO", description: "Sem desconto por condição." },
  {
    value: "MAL_CONDICIONADO",
    description:
      "Desconto de 15%. Agilidade de 80 a 100 corta pela metade; de 1 a 30 soma 10 pontos.",
  },
  {
    value: "DOENTE",
    description: "Desconto de 30%, com o mesmo ajuste de agilidade.",
  },
];

interface PlayerConditionDialogProps {
  player: Player;
  onClose: () => void;
  onSaved: (player: Player) => void;
}

export function PlayerConditionDialog({
  player,
  onClose,
  onSaved,
}: PlayerConditionDialogProps) {
  const [selected, setSelected] = useState<Condition>(player.condition);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // A API recusa DOENTE → APTO direto; a tela já evita o pedido.
  const blocked = (value: Condition) =>
    player.condition === "DOENTE" && value === "APTO";

  const losesLineup =
    player.club_id !== null &&
    selected === "DOENTE" &&
    player.condition !== "DOENTE";

  async function handleSave() {
    if (submitting || selected === player.condition) return;

    setSubmitting(true);
    setApiError(null);

    try {
      const saved = await changePlayerCondition(player.id, selected);
      toast.success(
        `${saved.name} agora está ${CONDITION_LABELS[saved.condition].toLowerCase()}.`,
        { description: `Valor de mercado ${formatMoney(saved.market_value)}` },
      );
      onSaved(saved);
      onClose();
    } catch (error) {
      setApiError(
        error instanceof Error
          ? error.message
          : "Não foi possível alterar a condição. Tente de novo.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !submitting) onClose();
      }}
    >
      <DialogContent className="p-6 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Alterar condição física
          </DialogTitle>
          <DialogDescription>
            A condição muda o desconto do valor de mercado, recalculado ao
            salvar.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-3 rounded-lg border bg-muted-subtle p-3">
          <PlayerAvatar name={player.name} />
          <div className="mr-auto">
            <div className="font-medium">{player.name}</div>
            <div className="text-xs text-muted-foreground">
              {player.position} · {POSITION_LABELS[player.position]} ·{" "}
              {player.age} anos
            </div>
          </div>
          <ConditionBadge condition={player.condition} />
        </div>

        {apiError && (
          <Alert variant="destructive">
            <AlertDescription>{apiError}</AlertDescription>
          </Alert>
        )}

        <div
          role="radiogroup"
          aria-label="Nova condição"
          className="grid gap-2"
        >
          {OPTIONS.map(({ value, description }) => {
            const isBlocked = blocked(value);
            const isSelected = selected === value;

            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={isSelected}
                disabled={isBlocked || submitting}
                onClick={() => setSelected(value)}
                className={cn(
                  "flex items-start gap-3 rounded-lg border bg-background p-3 text-left transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60",
                  isSelected
                    ? "border-primary bg-primary-soft"
                    : "border-input hover:bg-muted",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border",
                    isSelected ? "border-primary" : "border-input",
                  )}
                >
                  {isSelected && (
                    <span className="size-2 rounded-full bg-primary" />
                  )}
                </span>
                <span className="grid gap-0.5">
                  <span className="flex items-center gap-2 font-medium">
                    {CONDITION_LABELS[value]}
                    {player.condition === value && (
                      <Badge variant="secondary">Atual</Badge>
                    )}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {description}
                  </span>
                  {isBlocked && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Lock aria-hidden className="size-3" />
                      De Doente não passa direto para Apto.
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {losesLineup && (
          <Alert>
            <AlertDescription>
              Se {player.name} for titular, ele sai da escalação ao salvar e o
              clube não poderá jogar até completar o time de novo.
            </AlertDescription>
          </Alert>
        )}

        <DialogFooter className="sm:justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={submitting}
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={submitting || selected === player.condition}
            onClick={handleSave}
          >
            {submitting ? "Salvando..." : "Salvar condição"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}