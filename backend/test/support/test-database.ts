import { execSync } from 'node:child_process';
import 'dotenv/config';
import pg from 'pg';

const TEST_DATABASE = 'mercado_test';

/** URL do banco de testes: mesmo servidor do `DATABASE_URL`, com outro nome de banco. */
export function testDatabaseUrl(): string {
  if (process.env.TEST_DATABASE_URL) return process.env.TEST_DATABASE_URL;
  const base = new URL(process.env.DATABASE_URL!);
  base.pathname = `/${TEST_DATABASE}`;
  return base.toString();
}

/** Cria o banco de testes se faltar e aplica as migrations do Prisma. */
export async function prepareTestDatabase(): Promise<void> {
  const url = testDatabaseUrl();
  const admin = new URL(url);
  const databaseName = admin.pathname.slice(1);
  admin.pathname = '/postgres';

  const client = new pg.Client({ connectionString: admin.toString() });
  await client.connect();
  try {
    const existing = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [databaseName],
    );
    if (existing.rowCount === 0)
      await client.query(`CREATE DATABASE "${databaseName}"`);
  } finally {
    await client.end();
  }

  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: url },
    stdio: 'pipe',
  });
}

export async function truncateAll(): Promise<void> {
  const client = new pg.Client({ connectionString: testDatabaseUrl() });
  await client.connect();
  try {
    await client.query(
      `TRUNCATE duelos_partida, partidas, escalacoes, transacoes, contratos, jogadores, clubes
       RESTART IDENTITY CASCADE`,
    );
  } finally {
    await client.end();
  }
}
