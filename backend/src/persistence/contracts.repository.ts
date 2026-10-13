import { Injectable } from '@nestjs/common';
import type { Contract } from '../generated/prisma/client.js';
import { type Cents, toDecimalString } from '../common/money.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { DbClient } from '../prisma/unit-of-work.js';

@Injectable()
export class ContractsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(
    data: {
      playerId: number;
      clubId: number;
      purchaseValue: Cents;
      loyaltyUntil: Date;
      startedAt: Date;
    },
    db: DbClient = this.prisma,
  ): Promise<Contract> {
    return db.contract.create({
      data: {
        playerId: data.playerId,
        clubId: data.clubId,
        purchaseValue: toDecimalString(data.purchaseValue),
        loyaltyUntil: data.loyaltyUntil,
        startedAt: data.startedAt,
        status: 'ATIVO',
      },
    });
  }

  findActiveByPlayer(
    playerId: number,
    db: DbClient = this.prisma,
  ): Promise<Contract | null> {
    return db.contract.findFirst({ where: { playerId, status: 'ATIVO' } });
  }

  findActiveByClub(
    clubId: number,
    db: DbClient = this.prisma,
  ): Promise<Contract[]> {
    return db.contract.findMany({ where: { clubId, status: 'ATIVO' } });
  }

  close(
    id: number,
    status: 'ENCERRADO' | 'RESCINDIDO',
    endedAt: Date,
    db: DbClient = this.prisma,
  ): Promise<Contract> {
    return db.contract.update({ where: { id }, data: { status, endedAt } });
  }
}
