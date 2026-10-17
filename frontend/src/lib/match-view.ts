import type { AttributeField } from "@/lib/player-form";
import type { Condition, Position } from "@/types/player";
import type { Duel, Match, MatchResult } from "@/types/league";

export const RESULT_LABELS: Record<MatchResult, string> = {
  MANDANTE: "Vitória do mandante",
  VISITANTE: "Vitória do visitante",
  EMPATE: "Empate",
};

/** Siglas curtas dos atributos, para a legenda de cada jogador no campo. */
export const ATTRIBUTE_SHORT: Record<string, string> = {
  shooting: "Fin",
  passing: "Pas",
  dribbling: "Dri",
  defending: "Def",
};

export function isKnownAttribute(
  attribute: string,
): attribute is AttributeField {
  return attribute in ATTRIBUTE_SHORT;
}

export interface MatchStarter {
  id: number;
  name: string;
  position: Position;
  condition: Condition;
  /** Valor usado no ataque (já com o efeito da condição) e se virou gol. */
  attack?: { attribute: string; value: number; goal: boolean };
  defense?: { value: number };
}

export type Side = "home" | "away";

/**
 * Os 6 duelos mostram os 10 titulares. Em cada lado, o ataque 1/2/3 usa o 4º/3º/2º
 * jogador de linha e a defesa do outro lado usa o goleiro, o 1º e o 2º de linha.
 * Só para mostrar; o placar e os duelos vêm prontos da API.
 */
export function startersOf(match: Match, side: Side): MatchStarter[] {
  const clubId = match[side].club_id;
  const attacks = match.duels.filter(
    (duel) => duel.attacking_club_id === clubId,
  );
  const defenses = match.duels.filter(
    (duel) => duel.attacking_club_id !== clubId,
  );

  const base = (player: Duel["attacker"]): MatchStarter => ({
    id: player.player_id,
    name: player.player_name,
    position: player.position,
    condition: player.condition,
  });
  const attacker = (duel: Duel): MatchStarter => ({
    ...base(duel.attacker),
    attack: {
      attribute: duel.attacker.attribute,
      value: duel.attacker.value,
      goal: duel.goal,
    },
  });
  const defender = (duel: Duel): MatchStarter => ({
    ...base(duel.defender),
    defense: { value: duel.defender.value },
  });

  const [attack1, attack2, attack3] = attacks.sort((a, b) => a.order - b.order);
  const [defense1, defense2, defense3] = defenses.sort(
    (a, b) => a.order - b.order,
  );
  const secondFieldPlayer: MatchStarter = {
    ...attacker(attack3),
    defense: { value: defense3.defender.value },
  };

  // Do goleiro ao 4º jogador de linha.
  return [
    defender(defense1),
    defender(defense2),
    secondFieldPlayer,
    attacker(attack2),
    attacker(attack1),
  ];
}

/** "2-1-1" vira [2, 1, 1]; "3-1" vira [3, 0, 1]. */
export function formationShape(formation: string): [number, number, number] {
  const parts = formation.split("-").map(Number);
  return parts.length === 2
    ? [parts[0], 0, parts[1]]
    : [parts[0], parts[1], parts[2]];
}