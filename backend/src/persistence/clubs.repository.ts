import { Injectable } from '@nestjs/common';
import type { Club, Formation, Player } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { DbClient } from '../prisma/unit-of-work.js';
import { type Cents, toDecimalString } from '../common/money.js';

export type ClubWithSquad = Club & { players: Player[] };

const WITH_ACTIVE_SQUAD = {
  players: { where: { deletedAt: null } },
} as const;

const CLUB_CREATION_LOCK = 7_001;

@Injectable()
export class ClubsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(
    data: { name: string; nameKey: string; acronym: string },
    db: DbClient = this.prisma,
  ): Promise<Club> {
    return db.club.create({ data });
  }

  /** Serializa a criação de clubes para o limite de 20 valer mesmo com pedidos simultâneos. */
  async lockCreation(db: DbClient): Promise<void> {
    // $executeRaw: a função devolve `void`, tipo que o $queryRaw não consegue desserializar.
    await db.$executeRaw`SELECT pg_advisory_xact_lock(${CLUB_CREATION_LOCK})`;
  }

  count(db: DbClient = this.prisma): Promise<number> {
    return db.club.count();
  }

  findByNameKey(
    nameKey: string,
    db: DbClient = this.prisma,
  ): Promise<Club | null> {
    return db.club.findUnique({ where: { nameKey } });
  }

  async existsWithAcronym(
    acronym: string,
    db: DbClient = this.prisma,
  ): Promise<boolean> {
    return (await db.club.count({ where: { acronym } })) > 0;
  }

  findById(id: number, db: DbClient = this.prisma): Promise<Club | null> {
    return db.club.findUnique({ where: { id } });
  }

  findByIdWithSquad(
    id: number,
    db: DbClient = this.prisma,
  ): Promise<ClubWithSquad | null> {
    return db.club.findUnique({ where: { id }, include: WITH_ACTIVE_SQUAD });
  }

  findAllWithSquad(db: DbClient = this.prisma): Promise<ClubWithSquad[]> {
    return db.club.findMany({
      include: WITH_ACTIVE_SQUAD,
      orderBy: { id: 'asc' },
    });
  }

  findAll(db: DbClient = this.prisma): Promise<Club[]> {
    return db.club.findMany({ orderBy: { id: 'asc' } });
  }

  /** Bloqueia a linha do clube até o fim da transação; `false` se não existe. */
  async lockById(id: number, db: DbClient): Promise<boolean> {
    const rows = await db.$queryRaw<{ id: number }[]>`
      SELECT id FROM clubes WHERE id = ${id} FOR UPDATE`;
    return rows.length > 0;
  }

  setCash(id: number, cash: Cents, db: DbClient = this.prisma): Promise<Club> {
    return db.club.update({
      where: { id },
      data: { cash: toDecimalString(cash) },
    });
  }

  setFormation(
    id: number,
    formation: Formation | null,
    db: DbClient = this.prisma,
  ): Promise<Club> {
    return db.club.update({ where: { id }, data: { formation } });
  }
}
