import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { DbClient } from '../prisma/unit-of-work.js';

@Injectable()
export class LineupRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findPlayerIds(
    clubId: number,
    db: DbClient = this.prisma,
  ): Promise<number[]> {
    const entries = await db.lineupEntry.findMany({ where: { clubId } });
    return entries.map((entry) => entry.playerId);
  }

  /** RN19: a nova escalação substitui a anterior por inteiro. */
  async replace(
    clubId: number,
    playerIds: number[],
    db: DbClient,
  ): Promise<void> {
    await db.lineupEntry.deleteMany({ where: { clubId } });
    await db.lineupEntry.createMany({
      data: playerIds.map((playerId) => ({ clubId, playerId })),
    });
  }

  /** Titular vendido ou que passa a DOENTE sai da escalação (RN19). */
  async removePlayer(playerId: number, db: DbClient): Promise<void> {
    await db.lineupEntry.deleteMany({ where: { playerId } });
  }
}
