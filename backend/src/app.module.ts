import {
  type MiddlewareConsumer,
  Module,
  type NestModule,
} from '@nestjs/common';
import { ClubsModule } from './clubs/clubs.module.js';
import { CommonModule } from './common/common.module.js';
import { RequestLoggerMiddleware } from './common/request-logger.middleware.js';
import { LeagueModule } from './league/league.module.js';
import { MarketModule } from './market/market.module.js';
import { PersistenceModule } from './persistence/persistence.module.js';
import { PlayersModule } from './players/players.module.js';
import { PrismaModule } from './prisma/prisma.module.js';

@Module({
  imports: [
    CommonModule,
    PrismaModule,
    PersistenceModule,
    PlayersModule,
    ClubsModule,
    MarketModule,
    LeagueModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*path');
  }
}
