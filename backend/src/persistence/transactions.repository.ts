import { Injectable } from '@nestjs/common';
import type { Prisma, Transaction } from '../generated/prisma/client.js';
import { type Cents, toDecimalString } from '../common/money.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { DbClient } from '../prisma/unit-of-work.js';

export interface NewTransaction {
  clubId: number;
  playerId: number;
  playerName: string;
  type: 'COMPRA' | 'VENDA';
  value: Cents;
  fee: Cents;
  penalty: Cents;
  profit: Cents | null;
  cashChange: Cents;
  createdAt: Date;
}

export interface TransactionFilter {
  types?: ('COMPRA' | 'VENDA')[];
  playerId?: number;
}

@Injectable()
export class TransactionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(
    data: NewTransaction,
    db: DbClient = this.prisma,
  ): Promise<Transaction> {
    return db.transaction.create({
      data: {
        clubId: data.clubId,
        playerId: data.playerId,
        playerName: data.playerName,
        type: data.type,
        value: toDecimalString(data.value),
        fee: toDecimalString(data.fee),
        penalty: toDecimalString(data.penalty),
        profit: data.profit === null ? null : toDecimalString(data.profit),
        cashChange: toDecimalString(data.cashChange),
        createdAt: data.createdAt,
      },
    });
  }

  /** RN12: o clube que vendeu o jogador não pode comprá-lo de volta. */
  async hasSale(
    clubId: number,
    playerId: number,
    db: DbClient = this.prisma,
  ): Promise<boolean> {
    const sales = await db.transaction.count({
      where: { clubId, playerId, type: 'VENDA' },
    });
    return sales > 0;
  }

  /** RN17: da mais recente para a mais antiga; em empate de data e hora, id decrescente. */
  findByClub(
    clubId: number,
    filter: TransactionFilter,
    db: DbClient = this.prisma,
  ): Promise<Transaction[]> {
    const where: Prisma.TransactionWhereInput = { clubId };
    if (filter.types) where.type = { in: filter.types };
    if (filter.playerId !== undefined) where.playerId = filter.playerId;

    return db.transaction.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
  }
}
