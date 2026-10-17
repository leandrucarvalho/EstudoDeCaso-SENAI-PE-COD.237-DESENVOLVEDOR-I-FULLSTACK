import { CircleAlert, Info, Shield, Swords } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { FormField } from "@/components/FormField";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { playMatch } from "@/services/league";
import type { Club } from "@/types/club";

interface NewMatchDialogProps {
  clubs: Club[];
  onClose: () => void;
  /** Chamado depois de jogar (a lista de partidas mudou). */
  onPlayed: () => void;
}

function ClubSelect({
  id,
  value,
  clubs,
  onChange,
}: {
  id: string;
  value: string;
  clubs: Club[];
  onChange: (value: string) => void;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        id={id}
        className="w-full [&>[data-slot=select-value]]:mr-auto"
        aria-describedby={`${id}-message`}
      >
        <Shield aria-hidden className="text-muted-foreground" />
        <SelectValue placeholder="Escolha o clube" />
      </SelectTrigger>
      <SelectContent>
        {clubs.map((club) => (
          <SelectItem key={club.id} value={String(club.id)}>
            {club.name} ({club.acronym})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function NewMatchDialog({
  clubs,
  onClose,
  onPlayed,
}: NewMatchDialogProps) {
  const navigate = useNavigate();
  const [home, setHome] = useState(clubs[0] ? String(clubs[0].id) : "");
  const [away, setAway] = useState(clubs[1] ? String(clubs[1].id) : "");
  const [submitting, setSubmitting] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  const sameClub = home !== "" && home === away;
  const ready = home !== "" && away !== "" && !sameClub;

  function close() {
    if (!submitting) onClose();
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting || !ready) return;

    setSubmitting(true);
    setFailure(null);

    try {
      const match = await playMatch({
        home_club_id: Number(home),
        away_club_id: Number(away),
      });
      toast.success("Partida jogada", {
        description: `${match.home.club_name} ${match.home.goals} × ${match.away.goals} ${match.away.club_name}. Placar e duelos devolvidos pela API.`,
      });
      onPlayed();
      onClose();
      navigate(`/partidas/${match.id}`);
    } catch (error) {
      setFailure(
        error instanceof Error
          ? error.message
          : "Não foi possível jogar a partida. Tente de novo.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && close()}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto p-6 sm:max-w-lg">
        <form onSubmit={handleSubmit} noValidate className="grid gap-4">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              Nova partida
            </DialogTitle>
            <DialogDescription>
              Escolha o mandante e o visitante. O placar sai dos atributos dos
              titulares, sem sorteio.
            </DialogDescription>
          </DialogHeader>

          {failure && (
            <Alert variant="destructive">
              <CircleAlert />
              <AlertTitle>Não foi possível jogar a partida</AlertTitle>
              <AlertDescription>{failure}</AlertDescription>
            </Alert>
          )}

          <FormField
            id="match-home"
            label="Mandante"
            hint="Faz os 3 primeiros ataques."
          >
            <ClubSelect
              id="match-home"
              value={home}
              clubs={clubs}
              onChange={setHome}
            />
          </FormField>

          <FormField
            id="match-away"
            label="Visitante"
            hint="Precisa ser um clube diferente do mandante."
            error={
              sameClub ? "Escolha um clube diferente do mandante." : undefined
            }
          >
            <ClubSelect
              id="match-away"
              value={away}
              clubs={clubs}
              onChange={setAway}
            />
          </FormField>

          <div className="grid gap-2 rounded-lg border bg-muted-subtle p-3 text-xs text-muted-foreground">
            <p className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Info aria-hidden className="size-4" />
              Como sai o placar
            </p>
            <p>
              Cada time faz 3 ataques. Pela ordem do elenco, os jogadores de
              linha vão do 1º (mais recuado) ao 4º (mais avançado): o 4º
              enfrenta o goleiro, o 3º enfrenta o 1º e o 2º enfrenta o 2º do
              adversário. O atacante usa finalização (ATA), passe (MEI) ou
              drible (ZAG e LAT), e quem defende usa a defesa. É gol só quando o
              ataque é maior; mal condicionado joga com 15% a menos.
            </p>
            <p>
              Os dois clubes precisam ter os 5 titulares escalados. A partida
              não mexe no caixa.
            </p>
          </div>

          <DialogFooter className="border-t pt-4">
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              onClick={close}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting || !ready}>
              <Swords aria-hidden />
              {submitting ? "Jogando..." : "Jogar partida"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
