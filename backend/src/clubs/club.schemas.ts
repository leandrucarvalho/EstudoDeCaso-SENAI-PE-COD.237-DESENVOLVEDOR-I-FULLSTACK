import { z } from 'zod';
import { countCharacters, countWords, toComparable } from '../common/text.js';
import { normalizedText } from '../players/player.schemas.js';

function clubName() {
  return normalizedText().pipe(
    z
      .string()
      .refine(
        (name) => countCharacters(name) >= 3,
        'deve ter no mínimo 3 caracteres',
      )
      .refine(
        (name) => countCharacters(name) <= 60,
        'deve ter no máximo 60 caracteres',
      )
      .refine(
        (name) => /^[\p{L} .-]+$/u.test(name),
        'aceita só letras, espaços, hífen e ponto',
      )
      .refine(
        (name) => countWords(name) >= 2 && countWords(name) <= 5,
        'deve ter de 2 a 5 palavras',
      ),
  );
}

/** A sigla começa na primeira letra do nome e as outras duas aparecem no nome, nessa ordem. */
export function acronymMatchesName(name: string, acronym: string): boolean {
  const letters = Array.from(toComparable(name)).filter((character) =>
    /\p{L}/u.test(character),
  );
  const wanted = Array.from(acronym.toLowerCase());
  if (letters[0] !== wanted[0]) return false;

  let cursor = 1;
  for (const letter of wanted.slice(1)) {
    const found = letters.indexOf(letter, cursor);
    if (found === -1) return false;
    cursor = found + 1;
  }
  return true;
}

export const createClubSchema = z
  .object({
    name: clubName(),
    acronym: z
      .string()
      .regex(
        /^[A-Z]{3}$/,
        'deve ter exatamente 3 letras de A a Z, maiúsculas e sem acento',
      ),
  })
  .superRefine((club, context) => {
    if (new Set(club.acronym).size === 1) {
      context.addIssue({
        code: 'custom',
        path: ['acronym'],
        message: 'as três letras da sigla não podem ser todas iguais',
      });
    } else if (!acronymMatchesName(club.name, club.acronym)) {
      context.addIssue({
        code: 'custom',
        path: ['acronym'],
        message:
          'a sigla deve começar na primeira letra do nome e ter as letras na ordem do nome',
      });
    }
  });

export type CreateClubInput = z.infer<typeof createClubSchema>;

export const CLUB_SORTS = ['name', 'net_worth_asc', 'net_worth_desc'] as const;
export type ClubSort = (typeof CLUB_SORTS)[number];

export const listClubsQuerySchema = z
  .object({ sort: z.enum(CLUB_SORTS).optional() })
  .transform((query): { sort: ClubSort } => ({ sort: query.sort ?? 'name' }));

export type ListClubsQuery = z.output<typeof listClubsQuerySchema>;
