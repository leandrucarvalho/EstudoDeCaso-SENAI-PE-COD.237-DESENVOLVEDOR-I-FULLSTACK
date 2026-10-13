import { Global, Module } from '@nestjs/common';
import { ClubsRepository } from './clubs.repository.js';
import { ContractsRepository } from './contracts.repository.js';
import { LineupRepository } from './lineup.repository.js';
import { MatchesRepository } from './matches.repository.js';
import { PlayersRepository } from './players.repository.js';
import { TransactionsRepository } from './transactions.repository.js';

const REPOSITORIES = [
  PlayersRepository,
  ClubsRepository,
  ContractsRepository,
  TransactionsRepository,
  LineupRepository,
  MatchesRepository,
];

@Global()
@Module({ providers: REPOSITORIES, exports: REPOSITORIES })
export class PersistenceModule {}
