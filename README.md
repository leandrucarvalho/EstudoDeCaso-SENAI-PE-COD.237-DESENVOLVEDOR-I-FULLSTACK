# Mercado de Jogadores

Estudo de caso do processo seletivo SENAI/PE – CÓD. 237 DESENVOLVEDOR I (FULLSTACK): aplicação fullstack que simula o mercado de jogadores de uma liga de futebol fictícia (jogadores, clubes, compra e venda com contrato de fidelidade, escalação, partidas e classificação).

> Este README está em construção e será completado ao longo do desenvolvimento.

## 1. Pré-requisitos

| Ferramenta | Versão |
| --- | --- |
| Node.js (com npm) | 22 LTS |
| Docker e Docker Compose | Docker Engine 24+ e Compose v2 |

## 2. Banco de dados

PostgreSQL 16 em Docker.

```bash
# na raiz do repositório
docker compose up -d db
```

As migrations e o passo de recriação do banco serão documentados junto com o backend.

## 3. Como executar

A ser preenchido: instalação e execução do backend e do frontend, origem da API e URL do frontend.

## 4. Variáveis de ambiente

Modelos em `.env.example` (raiz e `backend/`).

## 5. Estrutura de pastas

```text
.
├── backend/    API REST (NestJS + TypeScript + Prisma)
├── frontend/   Interface (Vite + React + TypeScript)
└── docker-compose.yml
```

## 6. Decisões e premissas

- Backend: Node.js 22 + TypeScript com NestJS, Prisma como ORM e PostgreSQL 16.
- Frontend: React + TypeScript com Vite.

## 7. Funcionalidades não implementadas

A ser preenchido ao final.

## 8. Uso de inteligência artificial

A ser preenchido ao final.
