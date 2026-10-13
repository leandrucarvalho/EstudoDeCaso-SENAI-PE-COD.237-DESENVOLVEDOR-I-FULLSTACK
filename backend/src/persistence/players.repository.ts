import { Injectable } from '@nestjs/common';
import type { Player, Prisma } from '../generated/prisma/client.js';
import type { Condition, Position } from '../domain/position.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { DbClient } from '../prisma/unit-of-work.js';

export interface PlayerFilter {
  position?: Position;
  condition?: Condition;
  clubId?: number;
  /** `true`: só livres; `false`: só com clube. */
  free?: boolean;
  minAge?: number;
  maxAge?: number;
}

/** Todas as consultas ignoram jogadores com exclusão lógica (RN09). */
@Injectable()
export class PlayersRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(
    data: Prisma.PlayerUncheckedCreateInput,
    db: DbClient = this.prisma,
  ): Promise<Player> {
    return db.player.create({ data });
  }

  findActiveById(
    id: number,
    db: DbClient = this.prisma,
  ): Promise<Player | null> {
    return db.player.findFirst({ where: { id, deletedAt: null } });
  }

  findActiveByIds(
    ids: number[],
    db: DbClient = this.prisma,
  ): Promise<Player[]> {
    return db.player.findMany({ where: { id: { in: ids }, deletedAt: null } });
  }

  /** Bloqueia a linha do jogador até o fim da transação; `false` se não existe ou foi excluído. */
  async lockActive(id: number, db: DbClient): Promise<boolean> {
    const rows = await db.$queryRaw<{ id: number }[]>`
      SELECT id FROM jogadores WHERE id = ${id} AND excluido_em IS NULL FOR UPDATE`;
    return rows.length > 0;
  }

  findActive(
    filter: PlayerFilter,
    db: DbClient = this.prisma,
  ): Promise<Player[]> {
    const where: Prisma.PlayerWhereInput = { deletedAt: null };
    if (filter.position) where.position = filter.position;
    if (filter.condition) where.condition = filter.condition;
    if (filter.clubId !== undefined) where.clubId = filter.clubId;
    if (filter.free !== undefined && filter.clubId === undefined) {
      where.clubId = filter.free ? null : { not: null };
    }
    if (filter.minAge !== undefined || filter.maxAge !== undefined) {
      where.age = { gte: filter.minAge, lte: filter.maxAge };
    }
    return db.player.findMany({ where, orderBy: { id: 'asc' } });
  }

  findBySquad(clubId: number, db: DbClient = this.prisma): Promise<Player[]> {
    return db.player.findMany({ where: { clubId, deletedAt: null } });
  }

  countBySquad(clubId: number, db: DbClient = this.prisma): Promise<number> {
    return db.player.count({ where: { clubId, deletedAt: null } });
  }

  update(
    id: number,
    data: Prisma.PlayerUncheckedUpdateInput,
    db: DbClient = this.prisma,
  ): Promise<Player> {
    return db.player.update({ where: { id }, data });
  }

  softDelete(
    id: number,
    deletedAt: Date,
    db: DbClient = this.prisma,
  ): Promise<Player> {
    return db.player.update({ where: { id }, data: { deletedAt } });
  }
}
