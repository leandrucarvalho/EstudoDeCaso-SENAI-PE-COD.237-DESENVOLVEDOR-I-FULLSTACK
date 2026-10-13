import { z } from 'zod';
import { parseBrtDateTime } from '../common/brt-datetime.js';

const MAX_ID = 2_147_483_647;

const id = z.number().int().min(1).max(MAX_ID);

const brtDateTime = z.string().transform((text, context) => {
  const instant = parseBrtDateTime(text);
  if (!instant) {
    context.addIssue({
      code: 'custom',
      message:
        'deve estar no formato AAAA-MM-DDTHH:MM-03:00 e ser uma data e hora existentes',
    });
    return z.NEVER;
  }
  return instant;
});

export const buyPlayerSchema = z
  .object({ club_id: id, loyalty_until: brtDateTime })
  .transform((body) => ({
    clubId: body.club_id,
    loyaltyUntil: body.loyalty_until,
  }));

export type BuyPlayerInput = z.output<typeof buyPlayerSchema>;

const transactionTypes = z
  .string()
  .transform((text) => text.split(','))
  .pipe(
    z
      .array(z.enum(['COMPRA', 'VENDA']))
      .min(1)
      .refine(
        (types) => new Set(types).size === types.length,
        'não repita o tipo',
      ),
  );

const playerIdParam = z
  .string()
  .regex(/^[1-9]\d*$/, 'deve ser um inteiro positivo, só com dígitos')
  .transform(Number)
  .pipe(z.number().max(MAX_ID, 'valor muito grande'));

/** Filtros do histórico de transações e da exportação CSV (RN17 e RN18). */
export const transactionFilterSchema = z
  .object({
    type: transactionTypes.optional(),
    player_id: playerIdParam.optional(),
  })
  .transform((query) => ({ types: query.type, playerId: query.player_id }));

export type TransactionFilterInput = z.output<typeof transactionFilterSchema>;
