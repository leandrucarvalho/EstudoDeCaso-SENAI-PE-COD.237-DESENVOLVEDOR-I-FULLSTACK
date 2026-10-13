# Player Market

[🇧🇷 Português](README.md) · 🇺🇸 English

Case study for the SENAI/PE selection process – CODE 237 FULLSTACK DEVELOPER I: a fullstack application that simulates the player market of a fictional football league (players, clubs, purchases and sales with loyalty contracts, lineups, matches and standings).

> This README is completed as development goes on. The Portuguese version ([README.md](README.md)) is the reference; this file mirrors it.
> **Current state:** backend implemented and tested; frontend in progress.

## 1. Prerequisites

| Tool | Version |
| --- | --- |
| Node.js (with npm) | 22 LTS |
| Docker and Docker Compose | Docker Engine 24+ and Compose v2 |

## 2. Database

PostgreSQL 16 on Docker, with Prisma migrations. The database created by these steps starts empty.

```bash
# at the repository root
cp .env.example .env
docker compose up -d db

# in the backend folder
cd backend
cp .env.example .env
npm ci
npx prisma migrate deploy
```

Recreate the database from scratch (erases all data), in the `backend` folder:

```bash
npx prisma migrate reset --force
```

> If port 5432 is already in use, change `POSTGRES_PORT` in the root `.env` and the port in `DATABASE_URL` in `backend/.env`.

## 3. How to run

### Backend (in the `backend` folder, with the database up)

```bash
cd backend
cp .env.example .env      # if not copied yet
npm ci
npx prisma migrate deploy
npm run build
npm run start:prod
```

- **API origin:** `http://localhost:3000` (paths live under `/api/v1`).
- **Interactive documentation (Swagger):** `http://localhost:3000/api/v1/docs`.
- For development with auto-reload: `npm run start:dev`.

### Frontend

To be completed together with the frontend (expected URL: `http://localhost:5173`).

### Tests, lint and formatting (backend)

```bash
cd backend
npm test               # unit tests of the business rules (RN02 to RN21)
npm run test:e2e       # API integration tests (need the database up)
npm run lint           # oxlint
npm run format:check   # prettier, check only
```

Integration tests create and use a separate database (`mercado_test`) on the same server as `DATABASE_URL`.

## 4. Environment variables

Templates in `.env.example` (root) and `backend/.env.example`.

| Variable | Where | Purpose |
| --- | --- | --- |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_PORT` | root | PostgreSQL credentials and port on Docker (local development values) |
| `DATABASE_URL` | `backend/` | API connection to the database |
| `PORT` | `backend/` | API port (default 3000) |
| `CORS_ORIGIN` | `backend/` | Frontend origin(s) allowed by CORS, comma-separated |
| `TEST_DATABASE_URL` | `backend/` (optional) | Integration tests database; defaults to `mercado_test` on the same server |

## 5. Folder structure and libraries

```text
.
├── backend/
│   ├── prisma/          schema and migrations
│   ├── src/
│   │   ├── domain/      pure business rules (calculations, lineup, match, standings)
│   │   ├── players/ clubs/ market/ league/   modules: controller, service, schemas and mappers
│   │   ├── persistence/ repositories (the only place that talks to Prisma)
│   │   ├── prisma/      client and unit of work (transactions)
│   │   ├── common/      errors, global filter, pipes, clock, logging, dates and money
│   │   └── docs/        classes used only to document Swagger
│   └── test/            integration tests (API + database)
├── frontend/            UI (Vite + React + TypeScript)
└── docker-compose.yml
```

Backend layers: **controller** (HTTP and validation) → **service** (orchestration and transactions) → **domain** (pure rules, no database access) and **repository** (Prisma).

| Library | Purpose |
| --- | --- |
| `@nestjs/*` | API framework: modules, dependency injection, filters and pipes |
| `prisma`, `@prisma/client`, `@prisma/adapter-pg`, `pg` | ORM, migrations and PostgreSQL driver |
| `zod` | Declarative validation of body and query params, with the same definition used to document Swagger |
| `@nestjs/swagger` | Interactive API documentation (OpenAPI) |
| `dotenv` | `.env` loading |
| `vitest`, `supertest` | Unit and integration tests |
| `oxlint`, `prettier` | Lint and formatting |

## 6. Decisions and assumptions

- **Stack:** Node.js 22 + TypeScript with NestJS, Prisma and PostgreSQL 16; frontend with React + TypeScript and Vite.
- **Money:** values are computed in integer cents, with no floating point; rounding happens once, on the final result of each calculation, with ties rounded away from zero. `DECIMAL` columns.
- **Market value, overall, squad value, net worth and standings** are never stored; they are computed on every query by the same domain function.
- **Player listing:** accent-insensitive search, market value filter and sorting are applied in memory over the players already filtered in the database (position, condition, club, age range), keeping a single implementation of the market value formula.
- **Club name uniqueness (RN10):** `nome_normalizado` column (name with collapsed spaces, lowercase, accents kept) with a unique index; acronym has a unique index.
- **Concurrency:** purchase, sale, lineup, match and condition change run in a transaction, with row locks (`FOR UPDATE`) on player and club; club creation uses `pg_advisory_xact_lock` so the 20-club limit holds under simultaneous requests.
- **Errors:** every refusal is JSON with `message` (and `errors` when there are fields), with no stack trace; unexpected failures become 500.
- **Validation order:** format (400) → existence (404) → business rule (409).
- **Lineup and `DOENTE`:** a starter who becomes `DOENTE` or is sold leaves the lineup in the same transaction; the formation stays stored and `complete` becomes `false`.
- **Soft delete:** `excluido_em` is set; a deleted player counts as nonexistent on every endpoint.
- **Logs:** one line per request (date and time, method, path, status and duration) through NestJS `Logger`.

## 7. Features not implemented

Backend: nothing pending regarding the statement. Frontend: to be completed at the end.

## 8. Use of artificial intelligence

To be completed at the end, describing tools, where and how they were used, and what was accepted, changed or discarded.
