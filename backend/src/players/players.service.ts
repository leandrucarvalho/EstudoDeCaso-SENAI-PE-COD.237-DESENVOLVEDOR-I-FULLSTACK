import { Injectable } from '@nestjs/common';
import { Clock } from '../common/clock.js';
import { ConflictError, NotFoundError } from '../common/errors.js';
import { toDecimalString } from '../common/money.js';
import {
  calculateBaseValue,
  calculateOverall,
} from '../domain/player-valuation.js';
import { ClubsRepository } from '../persistence/clubs.repository.js';
import { LineupRepository } from '../persistence/lineup.repository.js';
import { PlayersRepository } from '../persistence/players.repository.js';
import { UnitOfWork } from '../prisma/unit-of-work.js';
import { listPlayers } from './player-listing.js';
import {
  type PlayerResponse,
  marketValueOf,
  toPlayerResponse,
} from './player.mapper.js';
import type {
  ChangeConditionInput,
  CreatePlayerInput,
  ListPlayersQuery,
  UpdatePlayerInput,
} from './player.schemas.js';

export interface PlayersPage {
  data: PlayerResponse[];
  meta: {
    page: number;
    limit: number;
    total_items: number;
    total_pages: number;
  };
}

const PLAYER_NOT_FOUND = 'Jogador não encontrado.';

@Injectable()
export class PlayersService {
  constructor(
    private readonly players: PlayersRepository,
    private readonly clubs: ClubsRepository,
    private readonly lineup: LineupRepository,
    private readonly unitOfWork: UnitOfWork,
    private readonly clock: Clock,
  ) {}

  async create(input: CreatePlayerInput): Promise<PlayerResponse> {
    const attributes = {
      pace: input.pace,
      shooting: input.shooting,
      passing: input.passing,
      dribbling: input.dribbling,
      defending: input.defending,
      physical: input.physical,
    };
    const overall = calculateOverall(input.position, attributes);
    const baseValue = calculateBaseValue({
      overall,
      potential: input.potential,
      age: input.age,
    });

    const player = await this.players.create({
      name: input.name,
      position: input.position,
      agility: input.agility,
      age: input.age,
      potential: input.potential,
      baseValue: toDecimalString(baseValue),
      ...attributes,
    });
    return toPlayerResponse(player);
  }

  async findById(id: number): Promise<PlayerResponse> {
    return toPlayerResponse(await this.getActive(id));
  }

  async list(query: ListPlayersQuery): Promise<PlayersPage> {
    if (
      query.clubId !== undefined &&
      !(await this.clubs.findById(query.clubId))
    ) {
      throw new NotFoundError('Clube não encontrado.');
    }

    const candidates = await this.players.findActive({
      position: query.position,
      condition: query.condition,
      clubId: query.clubId,
      free: query.free,
      minAge: query.minAge,
      maxAge: query.maxAge,
    });

    const page = listPlayers(
      candidates.map((player) => ({
        id: player.id,
        name: player.name,
        position: player.position,
        age: player.age,
        marketValue: marketValueOf(player),
        entity: player,
      })),
      query,
    );

    return {
      data: page.items.map((item) => toPlayerResponse(item.entity)),
      meta: {
        page: query.page,
        limit: query.limit,
        total_items: page.totalItems,
        total_pages: page.totalPages,
      },
    };
  }

  /** RN08: só nome, posição, agilidade e idade mudam; o resto continua o do cadastro. */
  update(id: number, input: UpdatePlayerInput): Promise<PlayerResponse> {
    return this.unitOfWork.run(async (db) => {
      await this.lockActive(id, db);
      const current = await this.getActive(id, db);

      if (current.clubId !== null && input.position !== current.position) {
        throw new ConflictError('Jogador com clube não pode mudar de posição.');
      }
      if (input.age < current.age) {
        throw new ConflictError(
          'A idade não pode ser menor que a idade atual.',
        );
      }

      const updated = await this.players.update(
        id,
        {
          name: input.name,
          position: input.position,
          agility: input.agility,
          age: input.age,
        },
        db,
      );
      return toPlayerResponse(updated);
    });
  }

  /** RN02/RN19: de DOENTE não vai direto para APTO; ficar DOENTE tira o titular da escalação. */
  changeCondition(
    id: number,
    input: ChangeConditionInput,
  ): Promise<PlayerResponse> {
    return this.unitOfWork.run(async (db) => {
      await this.lockActive(id, db);
      const current = await this.getActive(id, db);

      if (current.condition === input.condition)
        return toPlayerResponse(current);
      if (current.condition === 'DOENTE' && input.condition === 'APTO') {
        throw new ConflictError(
          'Um jogador DOENTE não volta direto para APTO; passe antes por MAL_CONDICIONADO.',
        );
      }

      const updated = await this.players.update(
        id,
        { condition: input.condition },
        db,
      );
      if (input.condition === 'DOENTE') await this.lineup.removePlayer(id, db);
      return toPlayerResponse(updated);
    });
  }

  /** RN09: exclusão lógica, só de jogador livre. */
  remove(id: number): Promise<void> {
    return this.unitOfWork.run(async (db) => {
      await this.lockActive(id, db);
      const current = await this.getActive(id, db);
      if (current.clubId !== null) {
        throw new ConflictError('Só é possível excluir jogador livre.');
      }
      await this.players.softDelete(id, this.clock.now(), db);
    });
  }

  private async lockActive(
    id: number,
    db: Parameters<PlayersRepository['lockActive']>[1],
  ) {
    if (!(await this.players.lockActive(id, db)))
      throw new NotFoundError(PLAYER_NOT_FOUND);
  }

  private async getActive(
    id: number,
    db?: Parameters<PlayersRepository['lockActive']>[1],
  ) {
    const player = await this.players.findActiveById(id, db);
    if (!player) throw new NotFoundError(PLAYER_NOT_FOUND);
    return player;
  }
}
