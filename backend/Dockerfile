FROM node:22-alpine AS build
WORKDIR /app

# O postinstall roda `prisma generate`: precisa do schema, da config e do tsconfig
# (é dele que o Prisma tira a extensão dos imports do cliente gerado).
COPY package.json package-lock.json prisma.config.ts tsconfig.json ./
COPY prisma ./prisma
RUN npm ci

COPY tsconfig.build.json nest-cli.json ./
COPY src ./src
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production

# Mantém as dependências de desenvolvimento: o `prisma migrate deploy` usa a CLI do Prisma.
COPY --from=build /app ./

EXPOSE 3000
# Aplica as migrations (banco vazio ou já atualizado) e sobe a API.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]