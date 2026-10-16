import { Injectable } from '@nestjs/common';
import { Clock } from '../common/clock.js';
import { ConflictError, NotFoundError } from '../common/errors.js';
import { compareNames, normalizeSpaces } from '../common/text.js';
import { MAX_CLUBS } from '../domain/market-rules.js';
import { ClubsRepository } from '../persistence/clubs.repository.js';
import { ContractsRepository } from '../persistence/contracts.repository.js';
import { UnitOfWork } from '../prisma/unit-of-work.js';
import {
  type ClubDetailResponse,
  type ClubResponse,
  toClubDetail,
  toClubResponse,
} from './club.mapper.js';
import type { ClubSort, CreateClubInput } from './club.schemas.js';

@Injectable()
export class ClubsService {
  constructor(
    private readonly clubs: ClubsRepository,
    private readonly contracts: ContractsRepository,
    private readonly unitOfWork: UnitOfWork,
    private readonly clock: Clock,
  ) {}

  /** RN10: caixa inicial, nome e sigla únicos e no máximo 20 clubes. */
  create(input: CreateClubInput): Promise<ClubResponse> {
    return this.unitOfWork.run(async (db) => {
      await this.clubs.lockCreation(db);

      if ((await this.clubs.count(db)) >= MAX_CLUBS) {
        throw new ConflictError(`A liga aceita no máximo ${MAX_CLUBS} clubes.`);
      }
      const nameKey = normalizeSpaces(input.name).toLowerCase();
      const sameName = await this.clubs.findByNameKey(nameKey, db);
      if (sameName) {
        throw new ConflictError(
          `Já existe um clube com o nome “${sameName.name}”.`,
        );
      }
      if (await this.clubs.existsWithAcronym(input.acronym, db)) {
        throw new ConflictError('Já existe um clube com essa sigla.');
      }

      const club = await this.clubs.create(
        { name: input.name, nameKey, acronym: input.acronym },
        db,
      );
      return toClubResponse(club, []);
    });
  }

  /** RN11: ordenação por nome ou patrimônio; o empate se desfaz pelo nome e depois pelo id. */
  async list(sort: ClubSort): Promise<ClubResponse[]> {
    const clubs = await this.clubs.findAllWithSquad();
    const responses = clubs.map((club) => toClubResponse(club, club.players));

    const byNetWorth: Record<
      ClubSort,
      (first: ClubResponse, second: ClubResponse) => number
    > = {
      name: () => 0,
      net_worth_asc: (a, b) => a.net_worth - b.net_worth,
      net_worth_desc: (a, b) => b.net_worth - a.net_worth,
    };

    return responses.sort(
      (a, b) =>
        byNetWorth[sort](a, b) || compareNames(a.name, b.name) || a.id - b.id,
    );
  }

  async findById(id: number): Promise<ClubDetailResponse> {
    const club = await this.clubs.findByIdWithSquad(id);
    if (!club) throw new NotFoundError('Clube não encontrado.');

    const activeContracts = await this.contracts.findActiveByClub(id);
    return toClubDetail(club, club.players, activeContracts, this.clock.now());
  }
}
