import type { Condition, Player, Position } from './player';

export type Formation = '3-1' | '2-2' | '2-1-1' | '1-2-1';

export interface Lineup {
  club_id: number;
  formation: Formation | null;
  /** true quando há os 5 titulares. */
  complete: boolean;
  players: Player[];
}

export interface LineupInput {
  formation: Formation;
  player_ids: number[];
}

export type MatchResult = 'MANDANTE' | 'VISITANTE' | 'EMPATE';

export interface MatchSide {
  club_id: number;
  club_name: string;
  formation: Formation;
  goals: number;
}

export interface MatchSummary {
  id: number;
  played_at: string;
  home: MatchSide;
  away: MatchSide;
  result: MatchResult;
}

export interface DuelPlayer {
  player_id: number;
  player_name: string;
  position: Position;
  condition: Condition;
  attribute: string;
  value: number;
}

export interface Duel {
  order: number;
  attacking_club_id: number;
  attacker: DuelPlayer;
  defender: DuelPlayer;
  goal: boolean;
}

export interface Match extends MatchSummary {
  duels: Duel[];
}

export interface PlayMatchInput {
  home_club_id: number;
  away_club_id: number;
}

export interface Standing {
  position: number;
  club_id: number;
  club_name: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
}