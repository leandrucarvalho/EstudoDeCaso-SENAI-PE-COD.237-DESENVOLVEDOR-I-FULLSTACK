import type { Player } from '../generated/prisma/client.js';
import { type Cents, fromCents, toCents } from '../common/money.js';
import {
  calculateMarketValue,
  calculateOverall,
} from '../domain/player-valuation.js';

export interface PlayerResponse {
  id: number;
  name: string;
  position: Player['position'];
  agility: number;
  age: number;
  condition: Player['condition'];
  base_value: number;
  market_value: number;
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
  potential: number;
  overall: number;
  club_id: number | null;
}

/** RN05: o valor de mercado é calculado a cada consulta, nunca gravado. */
export function marketValueOf(player: Player): Cents {
  return calculateMarketValue({
    baseValue: toCents(player.baseValue),
    condition: player.condition,
    agility: player.agility,
    age: player.age,
  });
}

/** RN06: o overall depende da posição atual e dos atributos do cadastro. */
export function overallOf(player: Player): number {
  return calculateOverall(player.position, {
    pace: player.pace,
    shooting: player.shooting,
    passing: player.passing,
    dribbling: player.dribbling,
    defending: player.defending,
    physical: player.physical,
  });
}

export function toPlayerResponse(player: Player): PlayerResponse {
  return {
    id: player.id,
    name: player.name,
    position: player.position,
    agility: player.agility,
    age: player.age,
    condition: player.condition,
    base_value: fromCents(toCents(player.baseValue)),
    market_value: fromCents(marketValueOf(player)),
    pace: player.pace,
    shooting: player.shooting,
    passing: player.passing,
    dribbling: player.dribbling,
    defending: player.defending,
    physical: player.physical,
    potential: player.potential,
    overall: overallOf(player),
    club_id: player.clubId,
  };
}
