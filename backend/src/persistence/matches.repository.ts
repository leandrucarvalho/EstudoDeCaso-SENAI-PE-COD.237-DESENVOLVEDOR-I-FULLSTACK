import { Injectable } from '@nestjs/common';
import type {
  Club,
  Formation,
  Match,
  MatchDuel,
  PlayerCondition,
  Position,
} from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { DbClient } from '../prisma/unit-of-work.js';

export type MatchWithClubs = Match & { homeClub: Club; awayClub: Club };
export type MatchWithDuels = MatchWithClubs & { duels: MatchDuel[] };

export interface NewDuel {
  order: number;
  attackingClubId: number;
  attackerId: number;
  defenderId: number;
  attackerName: string;
  defenderName: string;
  attackerPosition: Position;
  defenderPosition: Position;
  attackerCondition: PlayerCondition;
  defenderCondition: PlayerCondition;
  attackAttribute: string;
  defenseAttribute: string;
  attackValue: number;
  defenseValue: number;
  goal: boolean;
}

export interface NewMatch {
  homeClubId: number;
  awayClubId: number;
  homeGoals: number;
  awayGoals: number;
  homeFormation: Formation;
  awayFormation: Formation;
  playedAt: Date;
  duels: NewDuel[];
}

const CLUBS = { homeClub: true, awayClub: true } as const;

@Injectable()
export class MatchesRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: NewMatch, db: DbClient = this.prisma): Promise<MatchWithDuels> {
    const { duels, ...match } = data;
    return db.match.create({
      data: { ...match, duels: { create: duels } },
      include: { ...CLUBS, duels: { orderBy: { order: 'asc' } } },
    });
  }

  findByIdWithDuels(
    id: number,
    db: DbClient = this.prisma,
  ): Promise<MatchWithDuels | null> {
    return db.match.findUnique({
      where: { id },
      include: { ...CLUBS, duels: { orderBy: { order: 'asc' } } },
    });
  }

  /** RN21: da mais recente para a mais antiga; no mesmo instante, maior id primeiro. */
  findAll(
    clubId: number | undefined,
    db: DbClient = this.prisma,
  ): Promise<MatchWithClubs[]> {
    return db.match.findMany({
      where:
        clubId === undefined
          ? undefined
          : { OR: [{ homeClubId: clubId }, { awayClubId: clubId }] },
      include: CLUBS,
      orderBy: [{ playedAt: 'desc' }, { id: 'desc' }],
    });
  }

  findAllScores(db: DbClient = this.prisma): Promise<Match[]> {
    return db.match.findMany();
  }
}
