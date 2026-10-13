import { Injectable } from '@nestjs/common';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from './prisma.service.js';

/** Cliente do banco: o próprio Prisma ou o cliente de uma transação em andamento. */
export type DbClient = PrismaService | Prisma.TransactionClient;

/**
 * Operações atômicas (compra, venda, partida, escalação e condição que tira titular):
 * ou tudo é gravado, ou nada.
 */
@Injectable()
export class UnitOfWork {
  constructor(private readonly prisma: PrismaService) {}

  run<Result>(
    work: (db: Prisma.TransactionClient) => Promise<Result>,
  ): Promise<Result> {
    return this.prisma.$transaction(work, { timeout: 15_000 });
  }
}
