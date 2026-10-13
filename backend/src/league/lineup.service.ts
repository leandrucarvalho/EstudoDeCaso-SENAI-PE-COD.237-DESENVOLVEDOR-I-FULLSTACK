import { Injectable } from '@nestjs/common';
import { ConflictError, NotFoundError } from '../common/errors.js';
import { LINEUP_SIZE, positionsFitFormation } from '../domain/lineup-rules.js';
import { compareSquadOrder } from '../domain/position.js';
import { ClubsRepository } from '../persistence/clubs.repository.js';
import {
  formationFromDb,
  formationToDb,
} from '../persistence/formation-mapping.js';
import { LineupRepository } from '../persistence/lineup.repository.js';
import { PlayersRepository } from '../persistence/players.repository.js';
import { UnitOfWork } from '../prisma/unit-of-work.js';
import {
  type PlayerResponse,
  toPlayerResponse,
} from '../players/player.mapper.js';
import type { LineupInput } from './league.schemas.js';

export interface LineupResponse {
  club_id: number;
  formation: string | null;
  complete: boolean;
  players: PlayerResponse[];
}

const CLUB_NOT_FOUND = 'Clube não encontrado.';

@Injectable()
export class LineupService {
  constructor(
    private readonly clubs: ClubsRepository,
    private readonly players: PlayersRepository,
    private readonly lineup: LineupRepository,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async get(clubId: number): Promise<LineupResponse> {
    const club = await this.clubs.findById(clubId);
    if (!club) throw new NotFoundError(CLUB_NOT_FOUND);
    return this.view(clubId, club.formation);
  }

  /** RN19: a nova escalação substitui a anterior numa única operação. */
  replace(clubId: number, input: LineupInput): Promise<LineupResponse> {
    return this.unitOfWork.run(async (db) => {
      if (!(await this.clubs.lockById(clubId, db)))
        throw new NotFoundError(CLUB_NOT_FOUND);

      const players = await this.players.findActiveByIds(input.player_ids, db);
      if (players.length !== input.player_ids.length) {
        throw new NotFoundError('Jogador não encontrado.');
      }
      if (players.some((player) => player.clubId !== clubId)) {
        throw new ConflictError(
          'Todos os titulares devem ser do elenco do clube.',
        );
      }
      if (players.some((player) => player.condition === 'DOENTE')) {
        throw new ConflictError('Jogador DOENTE não pode ser escalado.');
      }
      if (
        !positionsFitFormation(
          input.formation,
          players.map((player) => player.position),
        )
      ) {
        throw new ConflictError(
          `As posições dos titulares não fecham a formação ${input.formation}.`,
        );
      }

      await this.lineup.replace(clubId, input.player_ids, db);
      const club = await this.clubs.setFormation(
        clubId,
        formationToDb(input.formation),
        db,
      );
      return this.view(clubId, club.formation, db);
    });
  }

  private async view(
    clubId: number,
    formation: Parameters<typeof formationFromDb>[0] | null,
    db?: Parameters<LineupRepository['findPlayerIds']>[1],
  ): Promise<LineupResponse> {
    const ids = await this.lineup.findPlayerIds(clubId, db);
    const starters = await this.players.findActiveByIds(ids, db);
    const ordered = [...starters].sort(compareSquadOrder);

    return {
      club_id: clubId,
      formation: formation === null ? null : formationFromDb(formation),
      complete: formation !== null && ordered.length === LINEUP_SIZE,
      players: ordered.map(toPlayerResponse),
    };
  }
}
