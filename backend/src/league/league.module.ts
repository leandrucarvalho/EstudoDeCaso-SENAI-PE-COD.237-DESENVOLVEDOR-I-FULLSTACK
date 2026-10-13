import { Module } from '@nestjs/common';
import { LeagueController } from './league.controller.js';
import { LineupService } from './lineup.service.js';
import { MatchesService } from './matches.service.js';
import { StandingsService } from './standings.service.js';

@Module({
  controllers: [LeagueController],
  providers: [LineupService, MatchesService, StandingsService],
})
export class LeagueModule {}
