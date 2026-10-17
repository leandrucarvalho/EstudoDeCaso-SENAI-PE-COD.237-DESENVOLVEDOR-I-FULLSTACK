import {
  CircleAlert,
  CircleCheck,
  HandCoins,
  History,
  Info,
  TriangleAlert,
} from "lucide-react";
import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { DetailList } from "@/components/DetailList";
import { PenaltyBadge } from "@/components/PenaltyBadge";
import { PlayerSummary } from "@/components/PlayerSummary";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { useAsync } from "@/hooks/useAsync";
import {
  formatDateTime,
  formatDays,
  formatMoney,
  formatSignedMoney,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import { getLineup } from "@/services/league";
import { sellPlayer } from "@/services/market";
import type { Club, SquadPlayer } from "@/types/club";
import type { SellResult } from "@/types/market";

interface SellPlayerDialogProps {
  player: SquadPlayer;
  club: Club;
  onClose: () => void;
  /** Chamado ao fechar depois de uma venda feita (o clube mudou). */
  onSold: () => void;
}

export function SellPlayerDialog({
  player,
  club,
  onClose,
  onSold,
}: SellPlayerDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [result, setResult] = useState<SellResult | null>(null);
  // Só para o aviso de titular; se a consulta falhar, o aviso não aparece.
  const [wasStarter, setWasStarter] = useState(false);

  const fetchLineup = useCallback(() => getLineup(club.id), [club.id]);
  const { data: lineup } = useAsync(fetchLineup);
  const isStarter =
    lineup?.players.some((starter) => starter.id === player.id) ?? false;

  function close() {
    if (submitting) return;
    if (result) onSold();
    onClose();
  }

  async function handleSell() {
    if (submitting) return;

    setSubmitting(true);
    setFailure(null);
    setWasStarter(isStarter);

    try {
      setResult(await sellPlayer(player.id));
    } catch (error) {
      setFailure(
        error instanceof Error
          ? error.message
          : "Não foi possível vender. Tente de novo.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    const noPenalty = result.penalty_rate === 0;
    const hasProfit = (result.profit ?? 0) > 0;
    const profitColor =
      (result.profit ?? 0) > 0
        ? "text-success-soft-foreground"
        : (result.profit ?? 0) < 0
          ? "text-destructive-soft-foreground"
          : undefined;

    return (
      <Dialog open onOpenChange={(open) => !open && close()}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto p-6 sm:max-w-md">
          <DialogHeader>
            <div className="flex size-10 items-center justify-center rounded-full bg-success-soft text-success-soft-foreground">
              <CircleCheck aria-hidden className="size-5" />
            </div>
            <DialogTitle className="text-lg font-semibold">
              Venda concluída
            </DialogTitle>
            <DialogDescription>
              {player.name} voltou a ficar livre
              {wasStarter ? " e saiu da escalação" : ""}.
              {noPenalty &&
                " A fidelidade já tinha terminado, então não houve multa."}
            </DialogDescription>
          </DialogHeader>

          <DetailList
            rows={[
              {
                label: "Valor de compra",
                value: formatMoney(result.purchase_value),
              },
              {
                label: "Valor de venda",
                caption: "Valor de mercado no momento da venda",
                value: formatMoney(result.value),
              },
              {
                label: "Dias restantes",
                value: formatDays(result.remaining_days),
              },
              {
                label: "Multa",
                caption: noPenalty
                  ? "Fidelidade cumprida: sem multa"
                  : `${result.penalty_rate}% do valor de venda, com teto de 10,00`,
                value: formatMoney(result.penalty),
              },
              {
                label: "Lucro",
                value: (
                  <span className={cn(profitColor)}>
                    {formatSignedMoney(result.profit)}
                  </span>
                ),
              },
              {
                label: "Comissão",
                caption: hasProfit
                  ? "10% do lucro até 10,00 + 20% do que passar"
                  : "Sem lucro: sem comissão",
                value: formatMoney(result.fee),
              },
              {
                label: "Crédito no caixa",
                caption: "Valor de venda − multa − comissão",
                value: formatSignedMoney(result.cash_change),
                strong: true,
              },
              {
                label: "Contrato",
                value: (
                  <Badge variant="outline">{result.contract_status}</Badge>
                ),
              },
              {
                label: `Novo caixa do ${club.name}`,
                value: formatMoney(result.club_cash),
                strong: true,
              },
            ]}
          />

          <DialogFooter>
            <Button variant="outline" asChild>
              <Link to={`/clubes/${club.id}?aba=historico`} onClick={close}>
                <History aria-hidden />
                Ver histórico
              </Link>
            </Button>
            <Button onClick={close}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open onOpenChange={(open) => !open && close()}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto p-6 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Vender {player.name}?
          </DialogTitle>
          <DialogDescription>
            O jogador sai do elenco do {club.name} e volta a ficar livre.
          </DialogDescription>
        </DialogHeader>

        {failure && (
          <Alert variant="destructive">
            <CircleAlert />
            <AlertTitle>A venda foi recusada</AlertTitle>
            <AlertDescription>{failure}</AlertDescription>
          </Alert>
        )}

        {isStarter && (
          <Alert variant="warning">
            <TriangleAlert />
            <AlertTitle>{player.name} é titular</AlertTitle>
            <AlertDescription>
              Ao vender, ele sai da escalação, e o {club.name} só volta a jogar
              partidas depois de escalar de novo os 5 titulares.
            </AlertDescription>
          </Alert>
        )}

        <PlayerSummary player={player} />

        {player.contract && (
          <DetailList
            rows={[
              {
                label: "Valor de compra",
                value: formatMoney(player.contract.purchase_value),
              },
              {
                label: "Fim da fidelidade",
                value: formatDateTime(player.contract.loyalty_until),
              },
              {
                label: "Dias restantes",
                value: formatDays(player.contract.remaining_days),
              },
              {
                label: "% de multa se vender agora",
                value: <PenaltyBadge rate={player.contract.penalty_rate} />,
              },
            ]}
          />
        )}

        <p className="flex items-start gap-2 rounded-lg border bg-muted-subtle p-3 text-xs text-muted-foreground">
          <Info aria-hidden className="mt-px size-4 shrink-0" />A venda é pelo
          valor de mercado do momento. Multa (teto de 10,00), lucro, comissão e
          crédito são calculados ao confirmar.
        </p>

        {submitting && (
          <p
            role="status"
            className="flex items-center gap-2 rounded-lg border bg-muted-subtle p-3 text-xs text-muted-foreground"
          >
            <Info aria-hidden className="size-4 shrink-0" />
            Enviando a venda. Os botões ficam desabilitados até a resposta.
          </p>
        )}

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" disabled={submitting} onClick={close}>
            Cancelar
          </Button>
          <Button disabled={submitting} onClick={handleSell}>
            <HandCoins aria-hidden />
            {submitting ? "Vendendo..." : "Confirmar venda"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
