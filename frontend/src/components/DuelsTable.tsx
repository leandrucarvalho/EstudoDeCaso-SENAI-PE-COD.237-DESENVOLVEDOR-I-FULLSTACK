import { Volleyball } from "lucide-react";
import { Fragment } from "react";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { isKnownAttribute } from "@/lib/match-view";
import { ATTRIBUTE_LABELS } from "@/lib/player-form";
import { POSITION_LABELS } from "@/lib/player-labels";
import type { Duel, DuelPlayer, Match } from "@/types/league";

// Posição do atacante e do defensor na ordem do elenco (só para o texto da linha).
// Em cada lado: ataque 1 = 4º de linha contra o goleiro, 2 = 3º contra o 1º, 3 = 2º contra o 2º.
const ATTACKER_RANK = ["4º", "3º", "2º"];
const DEFENDER_ROLE = ["Goleiro", "1º de linha", "2º de linha"];

function attributeLabel(attribute: string): string {
  return isKnownAttribute(attribute) ? ATTRIBUTE_LABELS[attribute] : attribute;
}

function PlayerLine({
  player,
  caption,
}: {
  player: DuelPlayer;
  caption: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <PlayerAvatar name={player.player_name} />
      <div>
        <div className="font-medium">{player.player_name}</div>
        <div className="text-xs text-muted-foreground">{caption}</div>
      </div>
    </div>
  );
}

function Value({ attribute, value }: { attribute: string; value: number }) {
  return (
    <span className="whitespace-nowrap">
      <span className="text-muted-foreground">{attributeLabel(attribute)}</span>{" "}
      <span className="font-semibold tabular-nums">{value}</span>
    </span>
  );
}

export function DuelsTable({ match }: { match: Match }) {
  const groups = [
    { side: match.home, role: "mandante" },
    { side: match.away, role: "visitante" },
  ].map(({ side, role }) => ({
    side,
    role,
    duels: match.duels
      .filter((duel) => duel.attacking_club_id === side.club_id)
      .sort((a, b) => a.order - b.order),
  }));
  const clubName = (id: number) =>
    id === match.home.club_id ? match.home.club_name : match.away.club_name;

  const row = (duel: Duel, index: number) => (
    <TableRow key={duel.order}>
      <TableCell className="tabular-nums text-muted-foreground">
        {duel.order}
      </TableCell>
      <TableCell>
        <PlayerLine
          player={duel.attacker}
          caption={`${duel.attacker.position}, ${ATTACKER_RANK[index]} de linha · ${clubName(duel.attacking_club_id)}`}
        />
      </TableCell>
      <TableCell>
        <Value
          attribute={duel.attacker.attribute}
          value={duel.attacker.value}
        />
      </TableCell>
      <TableCell>
        <PlayerLine
          player={duel.defender}
          caption={`${index === 0 ? POSITION_LABELS.GOL : `${duel.defender.position}, ${DEFENDER_ROLE[index]}`} · ${duel.attacking_club_id === match.home.club_id ? match.away.club_name : match.home.club_name}`}
        />
      </TableCell>
      <TableCell>
        <Value
          attribute={duel.defender.attribute}
          value={duel.defender.value}
        />
      </TableCell>
      <TableCell>
        {duel.goal ? (
          <Badge
            variant="outline"
            className="border-success-soft-border bg-success-soft text-success-soft-foreground"
          >
            <Volleyball aria-hidden />
            Gol
          </Badge>
        ) : (
          <Badge variant="outline">Sem gol</Badge>
        )}
      </TableCell>
    </TableRow>
  );

  return (
    <section className="rounded-xl border bg-card">
      <header className="p-4">
        <h2 className="font-semibold">Duelos</h2>
        <p className="text-sm text-muted-foreground">
          Os 3 ataques do mandante e depois os 3 do visitante. Os jogadores de
          linha vão do 1º (mais recuado) ao 4º (mais avançado), pela ordem do
          elenco: o 4º ataca o goleiro, o 3º ataca o 1º e o 2º ataca o 2º.
        </p>
      </header>
      <Table>
        <TableHeader className="bg-muted-subtle">
          <TableRow>
            <TableHead>#</TableHead>
            <TableHead>Atacante</TableHead>
            <TableHead>Ataque</TableHead>
            <TableHead>Defensor</TableHead>
            <TableHead>Defesa</TableHead>
            <TableHead>Resultado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {groups.map(({ side, role, duels }) => (
            <Fragment key={role}>
              <TableRow className="bg-muted-subtle hover:bg-muted-subtle">
                <TableCell colSpan={5} className="font-medium">
                  Ataques do {side.club_name} ({role})
                </TableCell>
                <TableCell className="text-right text-muted-foreground tabular-nums">
                  {side.goals} {side.goals === 1 ? "gol" : "gols"}
                </TableCell>
              </TableRow>
              {duels.map(row)}
            </Fragment>
          ))}
        </TableBody>
      </Table>
    </section>
  );
}
