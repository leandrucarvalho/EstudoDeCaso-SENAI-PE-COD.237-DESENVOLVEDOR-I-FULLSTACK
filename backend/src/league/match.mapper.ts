import type { MatchDuel } from '../generated/prisma/client.js';
import { formatBrtDateTime } from '../common/brt-datetime.js';
import type {
  MatchWithClubs,
  MatchWithDuels,
} from '../persistence/matches.repository.js';
import { formationFromDb } from '../persistence/formation-mapping.js';

interface DuelPlayerResponse {
  player_id: number;
  player_name: string;
  position: string;
  condition: string;
  attribute: string;
  value: number;
}

export interface DuelResponse {
  order: number;
  attacking_club_id: number;
  attacker: DuelPlayerResponse;
  defender: DuelPlayerResponse;
  goal: boolean;
}

export interface MatchSummaryResponse {
  id: number;
  played_at: string;
  home: {
    club_id: number;
    club_name: string;
    formation: string;
    goals: number;
  };
  away: {
    club_id: number;
    club_name: string;
    formation: string;
    goals: number;
  };
  result: 'MANDANTE' | 'VISITANTE' | 'EMPATE';
}

export interface MatchResponse extends MatchSummaryResponse {
  duels: DuelResponse[];
}

function resultOf(
  homeGoals: number,
  awayGoals: number,
): MatchSummaryResponse['result'] {
  if (homeGoals > awayGoals) return 'MANDANTE';
  if (awayGoals > homeGoals) return 'VISITANTE';
  return 'EMPATE';
}

export function toMatchSummary(match: MatchWithClubs): MatchSummaryResponse {
  return {
    id: match.id,
    played_at: formatBrtDateTime(match.playedAt),
    home: {
      club_id: match.homeClubId,
      club_name: match.homeClub.name,
      formation: formationFromDb(match.homeFormation),
      goals: match.homeGoals,
    },
    away: {
      club_id: match.awayClubId,
      club_name: match.awayClub.name,
      formation: formationFromDb(match.awayFormation),
      goals: match.awayGoals,
    },
    result: resultOf(match.homeGoals, match.awayGoals),
  };
}

function toDuel(duel: MatchDuel): DuelResponse {
  return {
    order: duel.order,
    attacking_club_id: duel.attackingClubId,
    attacker: {
      player_id: duel.attackerId,
      player_name: duel.attackerName,
      position: duel.attackerPosition,
      condition: duel.attackerCondition,
      attribute: duel.attackAttribute,
      value: duel.attackValue,
    },
    defender: {
      player_id: duel.defenderId,
      player_name: duel.defenderName,
      position: duel.defenderPosition,
      condition: duel.defenderCondition,
      attribute: duel.defenseAttribute,
      value: duel.defenseValue,
    },
    goal: duel.goal,
  };
}

export function toMatchResponse(match: MatchWithDuels): MatchResponse {
  return { ...toMatchSummary(match), duels: match.duels.map(toDuel) };
}
