import type { Club, Contract, Player } from '../generated/prisma/client.js';
import { formatBrtDateTime } from '../common/brt-datetime.js';
import { type Cents, fromCents, toCents } from '../common/money.js';
import {
  penaltyRateFor,
  calculateRemainingDays,
} from '../domain/market-rules.js';
import { compareSquadOrder } from '../domain/position.js';
import {
  type PlayerResponse,
  marketValueOf,
  toPlayerResponse,
} from '../players/player.mapper.js';

export interface ClubResponse {
  id: number;
  name: string;
  acronym: string;
  cash: number;
  squad_value: number;
  net_worth: number;
}

export interface ContractView {
  purchase_value: number;
  loyalty_until: string;
  remaining_days: number;
  penalty_rate: number;
}

export interface SquadPlayerResponse extends PlayerResponse {
  contract: ContractView | null;
}

export interface ClubDetailResponse extends ClubResponse {
  players: SquadPlayerResponse[];
}

/** RN11: valor do elenco = soma dos valores de mercado; patrimônio = caixa + valor do elenco. */
export function squadValueOf(players: Player[]): Cents {
  return players.reduce((total, player) => total + marketValueOf(player), 0);
}

export function toClubResponse(club: Club, players: Player[]): ClubResponse {
  const cash = toCents(club.cash);
  const squadValue = squadValueOf(players);
  return {
    id: club.id,
    name: club.name,
    acronym: club.acronym,
    cash: fromCents(cash),
    squad_value: fromCents(squadValue),
    net_worth: fromCents(cash + squadValue),
  };
}

/** RN11 e RN15: contrato do jogador, com dias restantes e % de multa se vendido agora. */
export function toContractView(contract: Contract, now: Date): ContractView {
  const remainingDays = calculateRemainingDays(contract.loyaltyUntil, now);
  return {
    purchase_value: fromCents(toCents(contract.purchaseValue)),
    loyalty_until: formatBrtDateTime(contract.loyaltyUntil),
    remaining_days: remainingDays,
    penalty_rate: penaltyRateFor(remainingDays),
  };
}

export function toClubDetail(
  club: Club,
  players: Player[],
  activeContracts: Contract[],
  now: Date,
): ClubDetailResponse {
  const contractByPlayer = new Map(
    activeContracts.map((contract) => [contract.playerId, contract]),
  );

  return {
    ...toClubResponse(club, players),
    players: [...players].sort(compareSquadOrder).map((player) => {
      const contract = contractByPlayer.get(player.id);
      return {
        ...toPlayerResponse(player),
        contract: contract ? toContractView(contract, now) : null,
      };
    }),
  };
}
