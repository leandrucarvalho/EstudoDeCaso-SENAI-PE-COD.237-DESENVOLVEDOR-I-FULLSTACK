import {
  ArrowRight,
  CalendarDays,
  CircleAlert,
  CircleCheck,
  Clock,
  Info,
  RefreshCw,
  Shield,
  ShoppingCart,
} from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { DetailList } from "@/components/DetailList";
import { FormField } from "@/components/FormField";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { defaultLoyalty, validateLoyalty } from "@/lib/buy-form";
import { formatDateTime, formatMoney, toApiDateTime } from "@/lib/format";
import { ApiError } from "@/lib/http";
import { buyPlayer } from "@/services/market";
import type { Club } from "@/types/club";
import type { BuyResult } from "@/types/market";
import type { Player } from "@/types/player";

interface BuyPlayerDialogProps {
  player: Player;
  clubs: Club[];
  onClose: () => void;
  /** Chamado ao fechar depois de uma compra feita (lista e caixas mudaram). */
  onBought: () => void;
}

export function BuyPlayerDialog({
  player,
  clubs,
  onClose,
  onBought,
}: BuyPlayerDialogProps) {
  const [clubId, setClubId] = useState<string>(
    clubs[0] ? String(clubs[0].id) : "",
  );
  const [loyalty, setLoyalty] = useState(() => defaultLoyalty());
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [failure, setFailure] = useState<{
    title: string;
    message: string;
    offline: boolean;
  } | null>(null);
  const [result, setResult] = useState<BuyResult | null>(null);

  const club = clubs.find((item) => String(item.id) === clubId);
  const errors = useMemo(() => validateLoyalty(loyalty), [loyalty]);
  const hasErrors = Object.keys(errors).length > 0;

  function close() {
    if (submitting) return;
    if (result) onBought();
    onClose();
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting || !club) return;

    setSubmitted(true);
    if (hasErrors) return;

    setSubmitting(true);
    setFailure(null);

    try {
      setResult(
        await buyPlayer(player.id, {
          club_id: club.id,
          loyalty_until: toApiDateTime(loyalty.date, loyalty.time),
        }),
      );
    } catch (error) {
      const offline = error instanceof ApiError && error.status === 0;
      setFailure({
        offline,
        title: offline ? "Sem conexão" : "Compra recusada",
        message:
          error instanceof Error
            ? error.message
            : "Não foi possível comprar. Tente de novo.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    const buyer = clubs.find((item) => item.id === result.club_id);

    return (
      <Dialog open onOpenChange={(open) => !open && close()}>
        <DialogContent className="p-6 sm:max-w-md">
          <DialogHeader>
            <div className="flex size-10 items-center justify-center rounded-full bg-success-soft text-success-soft-foreground">
              <CircleCheck aria-hidden className="size-5" />
            </div>
            <DialogTitle className="text-lg font-semibold">
              Compra concluída
            </DialogTitle>
            <DialogDescription>
              {player.name} agora é do {buyer?.name ?? "clube"}.
            </DialogDescription>
          </DialogHeader>

          <DetailList
            rows={[
              {
                label: "Valor",
                caption: "Valor de mercado no momento da compra",
                value: formatMoney(result.value),
              },
              {
                label: "Taxa",
                caption: "5% do valor, quando passa de 30,00",
                value: formatMoney(result.fee),
              },
              {
                label: "Custo total",
                caption: "Valor + taxa",
                value: formatMoney(result.value + result.fee),
                strong: true,
              },
              {
                label: "Fim da fidelidade",
                value: formatDateTime(result.contract.loyalty_until),
              },
              {
                label: "Contrato",
                value: (
                  <Badge
                    variant="outline"
                    className="border-success-soft-border bg-success-soft text-success-soft-foreground"
                  >
                    <span
                      aria-hidden
                      className="size-1.5 rounded-full bg-current"
                    />
                    {result.contract.status}
                  </Badge>
                ),
              },
              {
                label: `Novo caixa do ${buyer?.name ?? "clube"}`,
                value: formatMoney(result.club_cash),
                strong: true,
              },
            ]}
          />

          <DialogFooter>
            <Button variant="outline" asChild>
              <Link to={`/clubes/${result.club_id}`} onClick={close}>
                Ver clube
                <ArrowRight aria-hidden />
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
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto p-6 sm:max-w-lg">
        <form onSubmit={handleSubmit} noValidate className="grid gap-4">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              Comprar jogador
            </DialogTitle>
            <DialogDescription>
              Escolha o clube comprador e até quando vai a fidelidade do
              contrato.
            </DialogDescription>
          </DialogHeader>

          {failure && (
            <Alert variant="destructive">
              <CircleAlert />
              <AlertTitle>{failure.title}</AlertTitle>
              <AlertDescription>{failure.message}</AlertDescription>
            </Alert>
          )}

          <PlayerSummary player={player} />

          <FormField
            id="buy-club"
            label="Clube comprador"
            hint={
              club
                ? `Caixa atual: ${formatMoney(club.cash)}. O custo total (valor + taxa) pode ir até 50% do caixa.`
                : "Cadastre um clube para comprar."
            }
          >
            <Select value={clubId} onValueChange={setClubId}>
              <SelectTrigger
                id="buy-club"
                className="w-full [&>[data-slot=select-value]]:mr-auto"
                aria-describedby="buy-club-message"
              >
                <Shield aria-hidden className="text-muted-foreground" />
                <SelectValue placeholder="Escolha o clube" />
              </SelectTrigger>
              <SelectContent>
                {clubs.map((item) => (
                  <SelectItem key={item.id} value={String(item.id)}>
                    {item.name} ({item.acronym}) · caixa{" "}
                    {formatMoney(item.cash)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField
            id="buy-date"
            label="Fim da fidelidade"
            error={submitted || loyalty.date !== "" ? errors.date : undefined}
            hint="Depois do momento da compra e até 1.095 dias. Horário de Brasília; enviado com o fuso (-03:00)."
          >
            <div className="grid gap-3 sm:grid-cols-[1fr_9rem]">
              <div className="relative">
                <CalendarDays
                  aria-hidden
                  className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  id="buy-date"
                  type="date"
                  value={loyalty.date}
                  aria-invalid={Boolean(errors.date)}
                  aria-describedby="buy-date-message"
                  className="h-9 pl-9"
                  onChange={(event) =>
                    setLoyalty((current) => ({
                      ...current,
                      date: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="relative">
                <Clock
                  aria-hidden
                  className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  id="buy-time"
                  type="time"
                  aria-label="Horário do fim da fidelidade"
                  value={loyalty.time}
                  aria-invalid={Boolean(errors.time)}
                  className="h-9 pl-9"
                  onChange={(event) =>
                    setLoyalty((current) => ({
                      ...current,
                      time: event.target.value,
                    }))
                  }
                />
              </div>
            </div>
          </FormField>

          <p className="flex items-start gap-2 rounded-lg border bg-muted-subtle p-3 text-xs text-muted-foreground">
            <Info aria-hidden className="mt-px size-4 shrink-0" />A taxa é de 5%
            do valor de mercado, só quando ele passa de 30,00. Taxa, custo e
            novo caixa são calculados ao confirmar.
          </p>

          {submitting && (
            <p
              role="status"
              className="flex items-center gap-2 rounded-lg border bg-muted-subtle p-3 text-xs text-muted-foreground"
            >
              <Info aria-hidden className="size-4 shrink-0" />
              Enviando a compra. Os botões ficam desabilitados até a resposta.
            </p>
          )}

          <DialogFooter className="border-t pt-4">
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              onClick={close}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting || !club}>
              {failure?.offline ? (
                <RefreshCw aria-hidden />
              ) : (
                <ShoppingCart aria-hidden />
              )}
              {submitting
                ? "Comprando..."
                : failure?.offline
                  ? "Tentar de novo"
                  : "Confirmar compra"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
