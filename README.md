# Mercado de Jogadores

🇧🇷 Português · [🇺🇸 English](README.en.md)

Estudo de caso do processo seletivo SENAI/PE – CÓD. 237 DESENVOLVEDOR I (FULLSTACK): aplicação fullstack que simula o mercado de jogadores de uma liga de futebol fictícia (jogadores, clubes, compra e venda com contrato de fidelidade, escalação, partidas e classificação).

> Este README é completado ao longo do desenvolvimento. A versão em inglês ([README.en.md](README.en.md)) espelha este arquivo.
> **Estado atual:** backend implementado e testado; frontend em desenvolvimento.

## 1. Pré-requisitos

| Ferramenta | Versão |
| --- | --- |
| Node.js (com npm) | 22 LTS |
| Docker e Docker Compose | Docker Engine 24+ e Compose v2 |

## 2. Banco de dados

PostgreSQL 16 em Docker, com migrations do Prisma. O banco criado por estes passos começa vazio.

```bash
# na raiz do repositório
cp .env.example .env
docker compose up -d db

# na pasta backend
cd backend
cp .env.example .env
npm ci
npx prisma migrate deploy
```

Recriar o banco do zero (apaga todos os dados), na pasta `backend`:

```bash
npx prisma migrate reset --force
```

> Se a porta 5432 já estiver em uso, ajuste `POSTGRES_PORT` no `.env` da raiz e a porta em `DATABASE_URL` no `backend/.env`.

## 3. Como executar

### Backend (na pasta `backend`, com o banco no ar)

```bash
cd backend
cp .env.example .env      # se ainda não copiou
npm ci
npx prisma migrate deploy
npm run build
npm run start:prod
```

- **Origem da API:** `http://localhost:3000` (os caminhos ficam sob `/api/v1`).
- **Documentação interativa (Swagger):** `http://localhost:3000/api/v1/docs`.
- Para desenvolvimento, com recarga automática: `npm run start:dev`.

### Frontend

A ser preenchido junto com o frontend (URL prevista: `http://localhost:5173`).

### Testes, lint e formatação (backend)

```bash
cd backend
npm test               # testes unitários das regras de negócio (RN02 a RN21)
npm run test:e2e       # testes de integração da API (precisam do banco no ar)
npm run lint           # oxlint
npm run format:check   # prettier, só verifica
```

Os testes de integração criam e usam um banco separado (`mercado_test`) no mesmo servidor do `DATABASE_URL`.

## 4. Variáveis de ambiente

Modelos em `.env.example` (raiz) e `backend/.env.example`.

| Variável | Onde | Para que serve |
| --- | --- | --- |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_PORT` | raiz | Credenciais e porta do PostgreSQL no Docker (valores de desenvolvimento local) |
| `DATABASE_URL` | `backend/` | Conexão da API com o banco |
| `PORT` | `backend/` | Porta da API (padrão 3000) |
| `CORS_ORIGIN` | `backend/` | Origem(ns) do frontend liberada(s) no CORS, separadas por vírgula |
| `TEST_DATABASE_URL` | `backend/` (opcional) | Banco dos testes de integração; por padrão, `mercado_test` no mesmo servidor |

## 5. Estrutura de pastas e bibliotecas

```text
.
├── backend/
│   ├── prisma/          schema e migrations
│   ├── src/
│   │   ├── domain/      regras de negócio puras (cálculos, escalação, partida, classificação)
│   │   ├── players/ clubs/ market/ league/   módulos: controller, serviço, schemas e mapeadores
│   │   ├── persistence/ repositórios (único lugar que fala com o Prisma)
│   │   ├── prisma/      cliente e unidade de trabalho (transações)
│   │   ├── common/      erros, filtro global, pipes, relógio, logs, datas e moeda
│   │   └── docs/        classes usadas só para documentar o Swagger
│   └── test/            testes de integração (API + banco)
├── frontend/            interface (Vite + React + TypeScript)
└── docker-compose.yml
```

Camadas do backend: **controller** (HTTP e validação) → **serviço** (orquestração e transações) → **domínio** (regras puras, sem acesso a banco) e **repositório** (Prisma).

| Biblioteca | Para que serve |
| --- | --- |
| `@nestjs/*` | Framework da API: módulos, injeção de dependência, filtros e pipes |
| `prisma`, `@prisma/client`, `@prisma/adapter-pg`, `pg` | ORM, migrations e driver do PostgreSQL |
| `zod` | Validação declarativa de corpo e query params, com a mesma definição usada para documentar o Swagger |
| `@nestjs/swagger` | Documentação interativa da API (OpenAPI) |
| `dotenv` | Leitura do `.env` |
| `vitest`, `supertest` | Testes unitários e de integração |
| `oxlint`, `prettier` | Lint e formatação |

## 6. Decisões e premissas

- **Stack:** Node.js 22 + TypeScript com NestJS, Prisma e PostgreSQL 16; frontend com React + TypeScript e Vite.
- **Moeda:** valores calculados em centavos inteiros, sem ponto flutuante; o arredondamento é feito uma única vez, no resultado final de cada cálculo, com o meio para longe do zero. Colunas em `DECIMAL`.
- **Valor de mercado, overall, valor do elenco, patrimônio e classificação** nunca são gravados; são calculados a cada consulta pela mesma função do domínio.
- **Listagem de jogadores:** a busca sem acentos, o filtro por valor de mercado e a ordenação são aplicados em memória sobre os jogadores já filtrados no banco (posição, condição, clube, faixa de idade), para manter uma única implementação da fórmula do valor de mercado.
- **Unicidade do nome do clube (RN10):** coluna `nome_normalizado` (nome sem espaços repetidos, em minúsculas e com acentos) com índice único; sigla com índice único.
- **Concorrência:** compra, venda, escalação, partida e alteração de condição rodam em transação, com bloqueio de linha (`FOR UPDATE`) do jogador e do clube; a criação de clubes usa `pg_advisory_xact_lock` para o limite de 20 valer com pedidos simultâneos.
- **Erros:** toda recusa é JSON com `message` (e `errors`, quando há campos), sem stack trace; falha inesperada vira 500.
- **Ordem das validações:** formato (400) → existência (404) → regra de negócio (409).
- **Escalação e `DOENTE`:** o titular que passa a `DOENTE` ou é vendido sai da escalação na mesma transação; a formação continua gravada e `complete` fica `false`.
- **Exclusão lógica:** `excluido_em` preenchido; jogador excluído conta como inexistente em todos os endpoints.
- **Logs:** uma linha por requisição (data e hora, método, caminho, status e duração) pelo `Logger` do NestJS.

## 7. Funcionalidades não implementadas

Backend: nenhuma pendente em relação ao enunciado. Frontend: a ser preenchido ao final.

## 8. Uso de inteligência artificial

A ser preenchido ao final, descrevendo ferramentas, onde e como foram usadas, e o que foi aceito, alterado ou descartado.
