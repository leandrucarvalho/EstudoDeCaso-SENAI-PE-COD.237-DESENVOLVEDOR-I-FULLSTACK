import { Injectable } from '@nestjs/common';
import { Clock } from '../common/clock.js';
import { ConflictError, NotFoundError } from '../common/errors.js';
import { LINEUP_SIZE } from '../domain/lineup-rules.js';
import { type Starter, playMatch } from '../domain/match-engine.js';
import type { Club } from '../generated/prisma/client.js';
import { ClubsRepository } from '../persistence/clubs.repository.js';
import { LineupRepository } from '../persistence/lineup.repository.js';
import { MatchesRepository } from '../persistence/matches.repository.js';
import { PlayersRepository } from '../persistence/players.repository.js';
import { UnitOfWork } from '../prisma/unit-of-work.js';
import type { ListMatchesQuery, PlayMatchInput } from './league.schemas.js';
import {
  type MatchResponse,
  type MatchSummaryResponse,
  toMatchResponse,
  toMatchSummary,
} from './match.mapper.js';

const CLUB_NOT_FOUND = 'Clube não encontrado.';

@Injectable()
export class MatchesService {
  constructor(
    private readonly clubs: ClubsRepository,
    private readonly players: PlayersRepository,
    private readonly lineup: LineupRepository,
    private readonly matches: MatchesRepository,
    private readonly unitOfWork: UnitOfWork,
    private readonly clock: Clock,
  ) {}

  /** RN20: joga a partida na hora e grava o placar, as formações e os 6 duelos juntos. */
  play(input: PlayMatchInput): Promise<MatchResponse> {
    const playedAt = this.clock.now();

    return this.unitOfWork.run(async (db) => {
      const home = await this.clubs.findById(input.homeClubId, db);
      const away = await this.clubs.findById(input.awayClubId, db);
      if (!home || !away) throw new NotFoundError(CLUB_NOT_FOUND);

      // Trava os clubes sempre na mesma ordem para não haver impasse entre partidas simultâneas.
      for (const clubId of [home.id, away.id].sort((a, b) => a - b)) {
        await this.clubs.lockById(clubId, db);
      }

      const homeStarters = await this.startersOf(home, db);
      const awayStarters = await this.startersOf(away, db);
      const outcome = playMatch(homeStarters, awayStarters);

      const match = await this.matches.create(
        {
          homeClubId: home.id,
          awayClubId: away.id,
          homeGoals: outcome.homeGoals,
          awayGoals: outcome.awayGoals,
          homeFormation: home.formation!,
          awayFormation: away.formation!,
          playedAt,
          duels: outcome.duels.map((duel) => ({
            order: duel.order,
            attackingClubId: duel.attackingSide === 'home' ? home.id : away.id,
            attackerId: duel.attacker.playerId,
            defenderId: duel.defender.playerId,
            attackerName: duel.attacker.playerName,
            defenderName: duel.defender.playerName,
            attackerPosition: duel.attacker.position,
            defenderPosition: duel.defender.position,
            attackerCondition: duel.attacker.condition,
            defenderCondition: duel.defender.condition,
            attackAttribute: duel.attacker.attribute,
            defenseAttribute: duel.defender.attribute,
            attackValue: duel.attacker.value,
            defenseValue: duel.defender.value,
            goal: duel.goal,
          })),
        },
        db,
      );
      return toMatchResponse(match);
    });
  }

  async findById(id: number): Promise<MatchResponse> {
    const match = await this.matches.findByIdWithDuels(id);
    if (!match) throw new NotFoundError('Partida não encontrada.');
    return toMatchResponse(match);
  }

  async list(query: ListMatchesQuery): Promise<MatchSummaryResponse[]> {
    if (
      query.clubId !== undefined &&
      !(await this.clubs.findById(query.clubId))
    ) {
      throw new NotFoundError(CLUB_NOT_FOUND);
    }
    const matches = await this.matches.findAll(query.clubId);
    return matches.map(toMatchSummary);
  }

  /** O clube só joga com a escalação completa: formação definida e os 5 titulares. */
  private async startersOf(
    club: Club,
    db: Parameters<LineupRepository['findPlayerIds']>[1],
  ): Promise<Starter[]> {
    const ids = await this.lineup.findPlayerIds(club.id, db);
    if (club.formation === null || ids.length !== LINEUP_SIZE) {
      throw new ConflictError(
        `O clube ${club.name} não tem a escalação completa.`,
      );
    }

    const players = await this.players.findActiveByIds(ids, db);
    if (players.length !== LINEUP_SIZE) {
      throw new ConflictError(
        `O clube ${club.name} não tem a escalação completa.`,
      );
    }

    return players.map((player) => ({
      id: player.id,
      name: player.name,
      position: player.position,
      condition: player.condition,
      attributes: {
        pace: player.pace,
        shooting: player.shooting,
        passing: player.passing,
        dribbling: player.dribbling,
        defending: player.defending,
        physical: player.physical,
      },
    }));
  }
}
