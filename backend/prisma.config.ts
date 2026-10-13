import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: {
    // `prisma generate` não conecta ao banco, então a URL só é exigida nos comandos de migration.
    url:
      process.env.DATABASE_URL ??
      'postgresql://mercado:mercado@127.0.0.1:5432/mercado',
  },
});
