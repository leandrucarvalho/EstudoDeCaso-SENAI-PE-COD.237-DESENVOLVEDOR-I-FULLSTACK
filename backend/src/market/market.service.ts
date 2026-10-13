import { Injectable } from '@nestjs/common';
import { formatBrtDateTime } from '../common/brt-datetime.js';
import { Clock } from '../common/clock.js';
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from '../common/errors.js';
import { formatCsvMoney, fromCents, toCents } from '../common/money.js';
import {
  MAX_LOYALTY_DAYS,
  MAX_SQUAD_SIZE,
  calculatePurchaseFee,
  calculateRemainingDays,
  isWithinCashLimit,
  settleSale,
} from '../domain/market-rules.js';
import { ClubsRepository } from '../persistence/clubs.repository.js';
import { ContractsRepository } from '../persistence/contracts.repository.js';
import { LineupRepository } from '../persistence/lineup.repository.js';
import { PlayersRepository } from '../persistence/players.repository.js';
import { TransactionsRepository } from '../persistence/transactions.repository.js';
import { UnitOfWork } from '../prisma/unit-of-work.js';
import { marketValueOf } from '../players/player.mapper.js';
import {
  type TransactionResponse,
  type TransactionsSummary,
  summarize,
  toCsv,
  toTransactionResponse,
} from './market.mapper.js';
import type {
  BuyPlayerInput,
  TransactionFilterInput,
} from './market.schemas.js';

const MILLISECONDS_PER_DAY = 86_400_000;
const PLAYER_NOT_FOUND = 'Jogador não encontrado.';
const CLUB_NOT_FOUND = 'Clube não encontrado.';

export interface BuyResult extends TransactionResponse {
  contract: { purchase_value: number; loyalty_until: string; status: 'ATIVO' };
  club_cash: number;
}

export interface SellResult extends TransactionResponse {
  purchase_value: number;
  remaining_days: number;
  penalty_rate: number;
  contract_status: 'ENCERRADO' | 'RESCINDIDO';
  club_cash: number;
}

export interface TransactionsPage {
  data: TransactionResponse[];
  summary: TransactionsSummary;
}

@Injectable()
export class MarketService {
  constructor(
    private readonly players: PlayersRepository,
    private readonly clubs: ClubsRepository,
    private readonly contracts: ContractsRepository,
    private readonly transactions: TransactionsRepository,
    private readonly lineup: LineupRepository,
    private readonly unitOfWork: UnitOfWork,
    private readonly clock: Clock,
  ) {}

  /** RN12 a RN14: compra pelo valor de mercado do momento, com taxa e limite de caixa. */
  buy(playerId: number, input: BuyPlayerInput): Promise<BuyResult> {
    const now = this.clock.now();
    this.assertLoyaltyWindow(input.loyaltyUntil, now);

    return this.unitOfWork.run(async (db) => {
      if (!(await this.players.lockActive(playerId, db))) {
        throw new NotFoundError(PLAYER_NOT_FOUND);
      }
      if (!(await this.clubs.lockById(input.clubId, db))) {
        throw new NotFoundError(CLUB_NOT_FOUND);
      }

      const player = (await this.players.findActiveById(playerId, db))!;
      const club = (await this.clubs.findById(input.clubId, db))!;

      if (player.clubId !== null) {
        throw new ConflictError('O jogador não está livre.');
      }
      if (await this.transactions.hasSale(club.id, player.id, db)) {
        throw new ConflictError(
          'Um clube não pode comprar um jogador que ele mesmo vendeu.',
        );
      }

      const value = marketValueOf(player);
      const fee = calculatePurchaseFee(value);
      const totalCost = value + fee;
      const cash = toCents(club.cash);

      if (!isWithinCashLimit(totalCost, cash)) {
        throw new ConflictError(
          `O custo da compra (${formatCsvMoney(totalCost)}) passa do limite de 50% do caixa ` +
            `(${formatCsvMoney(Math.floor(cash / 2))}).`,
        );
      }
      if ((await this.players.countBySquad(club.id, db)) >= MAX_SQUAD_SIZE) {
        throw new ConflictError(
          `O elenco já tem o máximo de ${MAX_SQUAD_SIZE} jogadores.`,
        );
      }

      const newCash = cash - totalCost;
      await this.players.update(player.id, { clubId: club.id }, db);
      await this.clubs.setCash(club.id, newCash, db);
      await this.contracts.create(
        {
          playerId: player.id,
          clubId: club.id,
          purchaseValue: value,
          loyaltyUntil: input.loyaltyUntil,
          startedAt: now,
        },
        db,
      );
      const transaction = await this.transactions.create(
        {
          clubId: club.id,
          playerId: player.id,
          playerName: player.name,
          type: 'COMPRA',
          value,
          fee,
          penalty: 0,
          profit: null,
          cashChange: -totalCost,
          createdAt: now,
        },
        db,
      );

      return {
        ...toTransactionResponse(transaction),
        contract: {
          purchase_value: fromCents(value),
          loyalty_until: formatBrtDateTime(input.loyaltyUntil),
          status: 'ATIVO',
        },
        club_cash: fromCents(newCash),
      };
    });
  }

  /** RN15 e RN16: venda pelo valor de mercado, com multa de fidelidade e comissão. */
  sell(playerId: number): Promise<SellResult> {
    const now = this.clock.now();

    return this.unitOfWork.run(async (db) => {
      if (!(await this.players.lockActive(playerId, db))) {
        throw new NotFoundError(PLAYER_NOT_FOUND);
      }
      const player = (await this.players.findActiveById(playerId, db))!;
      if (player.clubId === null) {
        throw new ConflictError('Jogador livre não pode ser vendido.');
      }

      await this.clubs.lockById(player.clubId, db);
      const club = (await this.clubs.findById(player.clubId, db))!;
      const contract = await this.contracts.findActiveByPlayer(player.id, db);
      if (!contract) {
        throw new ConflictError('O jogador não tem contrato ativo.');
      }

      const marketValue = marketValueOf(player);
      const remainingDays = calculateRemainingDays(contract.loyaltyUntil, now);
      const purchaseValue = toCents(contract.purchaseValue);
      const settlement = settleSale({
        marketValue,
        purchaseValue,
        remainingDays,
      });
      const newCash = toCents(club.cash) + settlement.credit;

      await this.contracts.close(
        contract.id,
        settlement.contractStatus,
        now,
        db,
      );
      await this.players.update(player.id, { clubId: null }, db);
      await this.lineup.removePlayer(player.id, db);
      await this.clubs.setCash(club.id, newCash, db);
      const transaction = await this.transactions.create(
        {
          clubId: club.id,
          playerId: player.id,
          playerName: player.name,
          type: 'VENDA',
          value: marketValue,
          fee: settlement.commission,
          penalty: settlement.penalty,
          profit: settlement.profit,
          cashChange: settlement.credit,
          createdAt: now,
        },
        db,
      );

      return {
        ...toTransactionResponse(transaction),
        purchase_value: fromCents(purchaseValue),
        remaining_days: remainingDays,
        penalty_rate: settlement.penaltyRate,
        contract_status: settlement.contractStatus,
        club_cash: fromCents(newCash),
      };
    });
  }

  async history(
    clubId: number,
    filter: TransactionFilterInput,
  ): Promise<TransactionsPage> {
    const transactions = await this.findFiltered(clubId, filter);
    return {
      data: transactions.map(toTransactionResponse),
      summary: summarize(transactions),
    };
  }

  async exportCsv(
    clubId: number,
    filter: TransactionFilterInput,
  ): Promise<string> {
    return toCsv(await this.findFiltered(clubId, filter));
  }

  private async findFiltered(clubId: number, filter: TransactionFilterInput) {
    if (!(await this.clubs.findById(clubId)))
      throw new NotFoundError(CLUB_NOT_FOUND);
    if (
      filter.playerId !== undefined &&
      !(await this.players.findActiveById(filter.playerId))
    ) {
      throw new NotFoundError(PLAYER_NOT_FOUND);
    }
    return this.transactions.findByClub(clubId, filter);
  }

  /** O fim da fidelidade é depois da compra e até 1.095 dias depois dela. */
  private assertLoyaltyWindow(loyaltyUntil: Date, now: Date): void {
    const limit = now.getTime() + MAX_LOYALTY_DAYS * MILLISECONDS_PER_DAY;
    if (loyaltyUntil.getTime() <= now.getTime()) {
      throw new ValidationError(
        'loyalty_until: deve ser depois do momento da compra.',
      );
    }
    if (loyaltyUntil.getTime() > limit) {
      throw new ValidationError(
        `loyalty_until: deve ser no máximo ${MAX_LOYALTY_DAYS} dias depois da compra.`,
      );
    }
  }
}
