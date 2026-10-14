import type { Player } from './player';

export type ClubSort = 'name' | 'net_worth_asc' | 'net_worth_desc';

export interface Club {
  id: number;
  name: string;
  acronym: string;
  cash: number;
  squad_value: number;
  net_worth: number;
}

export interface Contract {
  purchase_value: number;
  loyalty_until: string;
  remaining_days: number;
  penalty_rate: number;
}

export interface SquadPlayer extends Player {
  contract: Contract | null;
}

export interface ClubDetail extends Club {
  players: SquadPlayer[];
}

export interface CreateClubInput {
  name: string;
  acronym: string;
}