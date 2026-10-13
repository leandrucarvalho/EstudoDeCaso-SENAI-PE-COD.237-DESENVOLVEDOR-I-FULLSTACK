import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module.js';
import { configureApp } from '../../src/app.setup.js';
import { Clock } from '../../src/common/clock.js';
import {
  prepareTestDatabase,
  testDatabaseUrl,
  truncateAll,
} from './test-database.js';

/** Relógio controlável: as regras de data usam o instante do servidor. */
export class FakeClock extends Clock {
  private current = new Date('2026-11-02T13:15:00Z');

  override now(): Date {
    return new Date(this.current);
  }

  set(instant: string): void {
    this.current = new Date(instant);
  }
}

export interface TestApp {
  app: INestApplication;
  clock: FakeClock;
  http: ReturnType<typeof request>;
  reset(): Promise<void>;
  close(): Promise<void>;
}

export async function createTestApp(): Promise<TestApp> {
  process.env.DATABASE_URL = testDatabaseUrl();
  process.env.CORS_ORIGIN = 'http://localhost:5173';
  await prepareTestDatabase();

  const clock = new FakeClock();
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(Clock)
    .useValue(clock)
    .compile();

  const app = moduleRef.createNestApplication();
  configureApp(app);
  await app.init();

  return {
    app,
    clock,
    http: request(app.getHttpServer()),
    reset: truncateAll,
    close: () => app.close(),
  };
}

export const PLAYER_ATTRIBUTES = {
  pace: 70,
  shooting: 68,
  passing: 82,
  dribbling: 79,
  defending: 55,
  physical: 64,
  potential: 86,
};

export function newPlayer(overrides: Record<string, unknown> = {}) {
  return {
    name: 'Meia Lua',
    position: 'MEI',
    agility: 85,
    age: 25,
    ...PLAYER_ATTRIBUTES,
    ...overrides,
  };
}
