import { Check, CircleAlert, Lock, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ConditionBadge } from "@/components/ConditionBadge";
import { Pitch, type PitchPlayer } from "@/components/Pitch";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DEFAULT_FORMATION,
  FORMATIONS,
  FORMATION_DESCRIPTIONS,
  fillSlots,
  fitsSector,
  slotsFor,
  usedAttributes,
  type Sector,
} from "@/lib/lineup";
import { POSITION_LABELS } from "@/lib/player-labels";
import { cn } from "@/lib/utils";
import { saveLineup } from "@/services/league";
import type { ClubDetail, SquadPlayer } from "@/types/club";
import type { Formation, Lineup } from "@/types/league";

interface LineupEditorProps {
  club: ClubDetail;
  lineup: Lineup;
  onSaved: () => void;
  /** Descarta o rascunho e volta ao que está salvo. */
  onCancel: () => void;
}

const PITCH_ORDER: Sector[] = ["GOL", "DEF", "MEI", "ATA"];

function joinNames(names: string[]): string {
  return names.length > 1
    ? `${names.slice(0, -1).join(", ")} e ${names.at(-1)}`
    : (names[0] ?? "");
}

export function LineupEditor({
  club,
  lineup,
  onSaved,
  onCancel,
}: LineupEditorProps) {
  const [formation, setFormation] = useState<Formation>(
    lineup.formation ?? DEFAULT_FORMATION,
  );
  // Um id (texto) por vaga; "" é vaga vazia.
  const [ids, setIds] = useState<string[]>(() =>
    fillSlots(lineup.formation ?? DEFAULT_FORMATION, lineup.players),
  );
  const [submitting, setSubmitting] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  const slots = slotsFor(formation);
  const byId = new Map(
    club.players.map((player) => [String(player.id), player]),
  );
  const starters = ids
    .map((id) => byId.get(id))
    .filter((player): player is SquadPlayer => player !== undefined);
  const complete = starters.length === slots.length;
  const attributes = usedAttributes(starters);
  const poorlyConditioned = starters
    .filter((player) => player.condition === "MAL_CONDICIONADO")
    .map((player) => player.name);
  const reserves = club.players.filter(
    (player) => !ids.includes(String(player.id)),
  );

  function changeFormation(next: Formation) {
    setFormation(next);
    setFailure(null);
    // Quem ainda encaixa nas vagas da nova formação continua titular.
    setIds(fillSlots(next, starters));
  }

  function choose(index: number, id: string) {
    setFailure(null);
    setIds((current) => current.map((value, i) => (i === index ? id : value)));
  }

  function candidates(index: number): SquadPlayer[] {
    return club.players.filter(
      (player) =>
        fitsSector(player.position, slots[index].sector) &&
        player.condition !== "DOENTE" &&
        (String(player.id) === ids[index] || !ids.includes(String(player.id))),
    );
  }

  async function handleSave() {
    if (submitting || !complete) return;

    setSubmitting(true);
    setFailure(null);

    try {
      await saveLineup(club.id, {
        formation,
        player_ids: ids.map(Number),
      });
      toast.success("Escalação salva", {
        description: `${club.name} na formação ${formation}, com ${slots.length} titulares.`,
      });
      onSaved();
    } catch (error) {
      setFailure(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar a escalação. Tente de novo.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const pitchRows: PitchPlayer[][] = PITCH_ORDER.map((sector) =>
    slots
      .map((slot, index) =>
        slot.sector === sector ? byId.get(ids[index]) : undefined,
      )
      .filter((player): player is SquadPlayer => player !== undefined),
  ).filter((row) => row.length > 0);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
      <section className="rounded-xl border bg-card">
        <header className="flex items-start justify-between gap-3 border-b p-4">
          <div>
            <h2 className="font-semibold">Titulares</h2>
            <p className="text-sm text-muted-foreground">
              1 goleiro e 4 jogadores de linha, na formação escolhida. Salvar
              troca os 5 de uma vez.
            </p>
          </div>
          {complete ? (
            <Badge
              variant="outline"
              className="border-success-soft-border bg-success-soft text-success-soft-foreground"
            >
              <Check aria-hidden />
              Completa
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="border-warning-soft-border bg-warning-soft text-warning-soft-foreground"
            >
              <TriangleAlert aria-hidden />
              Incompleta
            </Badge>
          )}
        </header>

        <div className="p-4">
          <h3 className="font-medium">Formação</h3>
          <p className="mb-3 text-sm text-muted-foreground">
            Os números contam os jogadores de linha de trás para frente. O
            goleiro fica fora da conta.
          </p>
          <div
            role="radiogroup"
            aria-label="Formação"
            className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
          >
            {FORMATIONS.map((option) => {
              const selected = option === formation;

              return (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={submitting}
                  onClick={() => changeFormation(option)}
                  className={cn(
                    "flex items-start gap-3 rounded-lg border p-3 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                    selected
                      ? "border-primary bg-primary-soft"
                      : "border-input hover:bg-muted",
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border",
                      selected ? "border-primary" : "border-input",
                    )}
                  >
                    {selected && (
                      <span className="size-2 rounded-full bg-primary" />
                    )}
                  </span>
                  <span>
                    <span
                      className={cn(
                        "block font-semibold",
                        selected && "text-primary",
                      )}
                    >
                      {option}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {FORMATION_DESCRIPTIONS[option]}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <Table>
          <TableHeader className="bg-muted-subtle">
            <TableRow>
              <TableHead>Vaga</TableHead>
              <TableHead>Titular</TableHead>
              <TableHead>Condição</TableHead>
              <TableHead className="text-right">Overall</TableHead>
              <TableHead>Atributos usados</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {slots.map((slot, index) => {
              const options = candidates(index);
              const player = byId.get(ids[index]);

              return (
                <TableRow key={index}>
                  <TableCell>
                    <div className="font-medium">{slot.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {slot.hint}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={ids[index]}
                      disabled={submitting || options.length === 0}
                      onValueChange={(id) => choose(index, id)}
                    >
                      <SelectTrigger
                        aria-label={`Titular da vaga ${index + 1}: ${slot.title}`}
                        className="w-60"
                      >
                        <SelectValue placeholder={`Sem ${slot.hint}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {options.map((option) => (
                          <SelectItem key={option.id} value={String(option.id)}>
                            {option.name} ({option.position})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {player && <ConditionBadge condition={player.condition} />}
                  </TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">
                    {player?.overall}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {player && attributes.get(player.id)?.join(" · ")}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        <div className="grid gap-3 border-t p-4">
          {failure && (
            <Alert variant="destructive">
              <CircleAlert />
              <AlertTitle>A escalação foi recusada</AlertTitle>
              <AlertDescription>{failure}</AlertDescription>
            </Alert>
          )}

          {poorlyConditioned.length > 0 && (
            <Alert variant="warning">
              <TriangleAlert />
              <AlertTitle>
                {joinNames(poorlyConditioned)}{" "}
                {poorlyConditioned.length > 1 ? "estão" : "está"} mal
                condicionado{poorlyConditioned.length > 1 ? "s" : ""}
              </AlertTitle>
              <AlertDescription>
                Podem jogar, mas cada atributo vale 15% a menos durante a
                partida.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="max-w-md text-sm text-muted-foreground">
              A escalação vale até ser trocada. Titular vendido ou que fica
              doente sai dela, e o clube só volta a jogar depois de escalar de
              novo.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={submitting}
                onClick={onCancel}
              >
                Cancelar
              </Button>
              <Button disabled={submitting || !complete} onClick={handleSave}>
                <Check aria-hidden />
                {submitting ? "Salvando..." : "Salvar escalação"}
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="grid content-start gap-4">
        <section className="rounded-xl border bg-card">
          <header className="border-b p-4">
            <h2 className="font-semibold">Em campo</h2>
            <p className="text-sm text-muted-foreground">
              Prévia da formação {formation}, com as vagas já preenchidas.
            </p>
          </header>
          <div className="p-4">
            <Pitch rows={pitchRows} />
          </div>
        </section>

        <section className="rounded-xl border bg-card">
          <header className="border-b p-4">
            <h2 className="font-semibold">Reservas</h2>
            <p className="text-sm text-muted-foreground">
              Jogadores do elenco fora dos titulares.
            </p>
          </header>
          <ul className="divide-y">
            {reserves.length === 0 && (
              <li className="p-4 text-sm text-muted-foreground">
                Nenhum reserva: todo o elenco está escalado.
              </li>
            )}
            {reserves.map((player) => (
              <li key={player.id} className="grid gap-2 p-4">
                <div className="flex items-center gap-3">
                  <PlayerAvatar name={player.name} />
                  <div className="mr-auto">
                    <div className="font-medium">{player.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {POSITION_LABELS[player.position]}
                    </div>
                  </div>
                  <ConditionBadge condition={player.condition} />
                </div>
                {player.condition === "DOENTE" && (
                  <p className="flex items-center gap-2 rounded-md border bg-muted-subtle px-3 py-2 text-xs text-muted-foreground">
                    <Lock aria-hidden className="size-3.5" />
                    Doente não pode ser titular.
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
