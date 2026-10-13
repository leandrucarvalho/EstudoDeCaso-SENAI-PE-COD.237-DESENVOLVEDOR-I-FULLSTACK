import { z } from 'zod';
import {
  countCharacters,
  countWords,
  hasControlCharacters,
  normalizeSpaces,
} from '../common/text.js';
import { CONDITIONS, POSITIONS } from '../domain/position.js';

const MAX_AGILITY_FROM_35 = 85;
const MAX_ATTRIBUTE_SUM = 480;
const MAX_VALUE_FILTER_CENTS = 55_000;
const MAX_ID = 2_147_483_647;

/** V4: rejeita caracteres de controle e normaliza os espaços antes de validar o tamanho. */
export function normalizedText() {
  return z
    .string()
    .refine(
      (text) => !hasControlCharacters(text),
      'não pode ter caracteres de controle',
    )
    .transform(normalizeSpaces);
}

function playerName() {
  return normalizedText().pipe(
    z
      .string()
      .refine(
        (name) => countCharacters(name) >= 3,
        'deve ter no mínimo 3 caracteres',
      )
      .refine(
        (name) => countCharacters(name) <= 100,
        'deve ter no máximo 100 caracteres',
      )
      .refine(
        (name) => countWords(name) >= 2,
        'deve ter pelo menos duas palavras',
      )
      .refine((name) => !/[0-9]/.test(name), 'não pode ter dígitos'),
  );
}

const position = z.enum(POSITIONS);
const condition = z.enum(CONDITIONS);
const integer = (min: number, max: number) =>
  z.number().int().min(min).max(max);

const editableFields = {
  name: playerName(),
  position,
  agility: integer(1, 100),
  age: integer(16, 45),
};

function checkAgilityByAge(
  data: { age: number; agility: number },
  context: z.RefinementCtx,
): void {
  if (data.age >= 35 && data.agility > MAX_AGILITY_FROM_35) {
    context.addIssue({
      code: 'custom',
      path: ['agility'],
      message: `com 35 anos ou mais, a agilidade vai no máximo até ${MAX_AGILITY_FROM_35}`,
    });
  }
}

export const createPlayerSchema = z
  .object({
    ...editableFields,
    pace: integer(1, 99),
    shooting: integer(1, 99),
    passing: integer(1, 99),
    dribbling: integer(1, 99),
    defending: integer(1, 99),
    physical: integer(1, 99),
    potential: integer(1, 99),
  })
  .superRefine((data, context) => {
    checkAgilityByAge(data, context);

    const attributes = [
      data.pace,
      data.shooting,
      data.passing,
      data.dribbling,
      data.defending,
      data.physical,
    ];
    const total = attributes.reduce((sum, value) => sum + value, 0);
    if (total > MAX_ATTRIBUTE_SUM) {
      context.addIssue({
        code: 'custom',
        path: ['pace'],
        message: `a soma dos seis atributos não pode passar de ${MAX_ATTRIBUTE_SUM}`,
      });
    }

    const highest = Math.max(...attributes);
    if (data.potential < highest) {
      context.addIssue({
        code: 'custom',
        path: ['potential'],
        message: 'o potencial não pode ser menor que o maior atributo',
      });
    }
    if (data.age >= 33 && data.potential !== highest) {
      context.addIssue({
        code: 'custom',
        path: ['potential'],
        message: 'com 33 anos ou mais, o potencial é igual ao maior atributo',
      });
    }
  });

export const updatePlayerSchema = z
  .object(editableFields)
  .superRefine(checkAgilityByAge);

export const changeConditionSchema = z.object({ condition });

export type CreatePlayerInput = z.infer<typeof createPlayerSchema>;
export type UpdatePlayerInput = z.infer<typeof updatePlayerSchema>;
export type ChangeConditionInput = z.infer<typeof changeConditionSchema>;

// ---- Query params de GET /players ----

const SORT_VALUES = [
  'name',
  'value_asc',
  'value_desc',
  'age_asc',
  'age_desc',
  'position',
] as const;
export type PlayerSort = (typeof SORT_VALUES)[number];

const positiveInteger = z
  .string()
  .regex(/^[1-9]\d*$/, 'deve ser um inteiro positivo, só com dígitos')
  .transform(Number)
  .pipe(z.number().max(MAX_ID, 'valor muito grande'));

const ageParam = positiveInteger.pipe(integer(16, 45));

const valueParam = z
  .string()
  .regex(
    /^(0|[1-9]\d*)(\.\d{1,2})?$/,
    'deve ser um decimal como 10, 10.5 ou 10.55',
  )
  .transform((text) => Math.round(Number(text) * 100))
  .pipe(z.number().max(MAX_VALUE_FILTER_CENTS, 'deve ser no máximo 550'));

const sortParam = z
  .string()
  .transform((text) => text.split(','))
  .pipe(
    z
      .array(z.enum(SORT_VALUES))
      .min(1)
      .max(2, 'informe no máximo dois critérios')
      .refine(
        (values) =>
          new Set(values.map((value) => value.split('_')[0])).size ===
          values.length,
        'não repita o mesmo campo de ordenação',
      ),
  );

const searchParam = normalizedText().pipe(
  z
    .string()
    .refine(
      (text) => countCharacters(text) >= 2,
      'deve ter no mínimo 2 caracteres',
    )
    .refine(
      (text) => countCharacters(text) <= 100,
      'deve ter no máximo 100 caracteres',
    ),
);

export const listPlayersQuerySchema = z
  .object({
    search: searchParam.optional(),
    position: position.optional(),
    condition: condition.optional(),
    free: z
      .enum(['true', 'false'])
      .transform((text) => text === 'true')
      .optional(),
    club_id: positiveInteger.optional(),
    min_age: ageParam.optional(),
    max_age: ageParam.optional(),
    min_value: valueParam.optional(),
    max_value: valueParam.optional(),
    sort: sortParam.optional(),
    page: positiveInteger.optional(),
    limit: positiveInteger.pipe(integer(1, 50)).optional(),
  })
  .superRefine((query, context) => {
    if (
      query.min_age !== undefined &&
      query.max_age !== undefined &&
      query.min_age > query.max_age
    ) {
      context.addIssue({
        code: 'custom',
        path: ['min_age'],
        message: 'min_age não pode ser maior que max_age',
      });
    }
    if (
      query.min_value !== undefined &&
      query.max_value !== undefined &&
      query.min_value > query.max_value
    ) {
      context.addIssue({
        code: 'custom',
        path: ['min_value'],
        message: 'min_value não pode ser maior que max_value',
      });
    }
    if (query.free === true && query.club_id !== undefined) {
      context.addIssue({
        code: 'custom',
        path: ['free'],
        message: 'free=true não combina com club_id',
      });
    }
  })
  .transform((query) => ({
    search: query.search,
    position: query.position,
    condition: query.condition,
    free: query.free,
    clubId: query.club_id,
    minAge: query.min_age,
    maxAge: query.max_age,
    minValue: query.min_value,
    maxValue: query.max_value,
    sort: query.sort ?? (['name'] as PlayerSort[]),
    page: query.page ?? 1,
    limit: query.limit ?? 10,
  }));

export type ListPlayersQuery = z.output<typeof listPlayersQuerySchema>;
