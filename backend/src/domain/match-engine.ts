import { divideRound } from '../common/money.js';
import {
  type AttributeName,
  type Attributes,
  type Condition,
  type Position,
  type SquadMember,
  compareSquadOrder,
} from './position.js';

export interface Starter extends SquadMember {
  condition: Condition;
  attributes: Attributes;
}

export interface DuelPlayer {
  playerId: number;
  playerName: string;
  position: Position;
  condition: Condition;
  attribute: AttributeName;
  value: number;
}

export interface Duel {
  order: number;
  attackingSide: 'home' | 'away';
  attacker: DuelPlayer;
  defender: DuelPlayer;
  goal: boolean;
}

export interface MatchOutcome {
  duels: Duel[];
  homeGoals: number;
  awayGoals: number;
  result: 'MANDANTE' | 'VISITANTE' | 'EMPATE';
}

const ATTACK_ATTRIBUTE: Record<Position, AttributeName> = {
  GOL: 'defending',
  ZAG: 'dribbling',
  LAT: 'dribbling',
  MEI: 'passing',
  ATA: 'shooting',
};

const POOR_CONDITION_PERCENT = 85;

/** RN20: titular MAL_CONDICIONADO joga com 15% a menos, arredondado com o meio para cima. */
function effectiveValue(starter: Starter, attribute: AttributeName): number {
  const raw = starter.attributes[attribute];
  return starter.condition === 'MAL_CONDICIONADO'
    ? divideRound(raw * POOR_CONDITION_PERCENT, 100)
    : raw;
}

function toDuelPlayer(starter: Starter, attribute: AttributeName): DuelPlayer {
  return {
    playerId: starter.id,
    playerName: starter.name,
    position: starter.position,
    condition: starter.condition,
    attribute,
    value: effectiveValue(starter, attribute),
  };
}

interface Team {
  goalkeeper: Starter;
  /** Jogadores de linha do 1º (mais recuado) ao 4º (mais avançado). */
  field: Starter[];
}

function organize(starters: Starter[]): Team {
  const ordered = [...starters].sort(compareSquadOrder);
  return { goalkeeper: ordered[0], field: ordered.slice(1) };
}

/** Os 3 ataques de um time: o 4º contra o goleiro, o 3º contra o 1º e o 2º contra o 2º. */
function attacksOf(
  side: 'home' | 'away',
  attacking: Team,
  defending: Team,
): Duel[] {
  const matchups: [Starter, Starter][] = [
    [attacking.field[3], defending.goalkeeper],
    [attacking.field[2], defending.field[0]],
    [attacking.field[1], defending.field[1]],
  ];
  const firstOrder = side === 'home' ? 1 : 4;

  return matchups.map(([attacker, defender], index) => {
    const attackerDuel = toDuelPlayer(
      attacker,
      ATTACK_ATTRIBUTE[attacker.position],
    );
    const defenderDuel = toDuelPlayer(defender, 'defending');
    return {
      order: firstOrder + index,
      attackingSide: side,
      attacker: attackerDuel,
      defender: defenderDuel,
      goal: attackerDuel.value > defenderDuel.value,
    };
  });
}

/** RN20: 6 duelos, sem sorteio; gol quando o valor do ataque é maior que o da defesa. */
export function playMatch(
  homeStarters: Starter[],
  awayStarters: Starter[],
): MatchOutcome {
  const home = organize(homeStarters);
  const away = organize(awayStarters);
  const duels = [
    ...attacksOf('home', home, away),
    ...attacksOf('away', away, home),
  ];

  const homeGoals = duels.filter(
    (duel) => duel.attackingSide === 'home' && duel.goal,
  ).length;
  const awayGoals = duels.filter(
    (duel) => duel.attackingSide === 'away' && duel.goal,
  ).length;

  let result: MatchOutcome['result'] = 'EMPATE';
  if (homeGoals > awayGoals) result = 'MANDANTE';
  if (awayGoals > homeGoals) result = 'VISITANTE';

  return { duels, homeGoals, awayGoals, result };
}
