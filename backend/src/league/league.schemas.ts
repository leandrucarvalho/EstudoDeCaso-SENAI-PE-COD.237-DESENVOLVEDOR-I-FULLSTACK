import { z } from 'zod';
import { FORMATIONS, LINEUP_SIZE } from '../domain/lineup-rules.js';

const MAX_ID = 2_147_483_647;
const id = z.number().int().min(1).max(MAX_ID);

export const lineupSchema = z.object({
  formation: z.enum(FORMATIONS),
  player_ids: z
    .array(id)
    .length(LINEUP_SIZE, `deve ter exatamente ${LINEUP_SIZE} jogadores`)
    .refine(
      (ids) => new Set(ids).size === ids.length,
      'os ids não podem se repetir',
    ),
});

export type LineupInput = z.output<typeof lineupSchema>;

export const playMatchSchema = z
  .object({ home_club_id: id, away_club_id: id })
  .refine((body) => body.home_club_id !== body.away_club_id, {
    path: ['away_club_id'],
    message: 'o mandante e o visitante devem ser clubes diferentes',
  })
  .transform((body) => ({
    homeClubId: body.home_club_id,
    awayClubId: body.away_club_id,
  }));

export type PlayMatchInput = z.output<typeof playMatchSchema>;

export const listMatchesQuerySchema = z
  .object({
    club_id: z
      .string()
      .regex(/^[1-9]\d*$/, 'deve ser um inteiro positivo, só com dígitos')
      .transform(Number)
      .pipe(z.number().max(MAX_ID, 'valor muito grande'))
      .optional(),
  })
  .transform((query) => ({ clubId: query.club_id }));

export type ListMatchesQuery = z.output<typeof listMatchesQuerySchema>;
