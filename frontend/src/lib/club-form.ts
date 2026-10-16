import { normalizeName } from "@/lib/player-form";
import type { CreateClubInput } from "@/types/club";

export interface ClubFormValues {
  name: string;
  acronym: string;
}

export type ClubFormField = keyof ClubFormValues;
export type ClubFormErrors = Partial<Record<ClubFormField, string>>;

export const EMPTY_CLUB_FORM: ClubFormValues = { name: "", acronym: "" };

const NAME_PATTERN = /^[\p{L} .-]+$/u;
const ACRONYM_PATTERN = /^[A-Z]{3}$/;

/** Sem acento e em minúsculas, como a API compara nome e sigla. */
function toComparable(text: string): string {
  return text.normalize("NFD").replace(/\p{Mn}/gu, "").toLowerCase();
}

function countWords(name: string): number {
  return name.split(" ").filter((word) => /\p{L}/u.test(word)).length;
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

/** Espelha a API (o backend continua sendo a fonte da verdade). Roda a cada tecla. */
export function validateClubForm(values: ClubFormValues): ClubFormErrors {
  const errors: ClubFormErrors = {};

  const name = normalizeName(values.name);
  const length = Array.from(name).length;
  if (name === "") {
    errors.name = "Informe o nome.";
  } else if (length < 3 || length > 60) {
    errors.name = "Use de 3 a 60 caracteres.";
  } else if (!NAME_PATTERN.test(name)) {
    errors.name = "Use só letras, espaços, hífen e ponto.";
  } else if (countWords(name) < 2 || countWords(name) > 5) {
    errors.name = "Use de 2 a 5 palavras.";
  }

  const { acronym } = values;
  if (acronym === "") {
    errors.acronym = "Informe a sigla.";
  } else if (!ACRONYM_PATTERN.test(acronym)) {
    errors.acronym = "Use exatamente 3 letras de A a Z, sem acento.";
  } else if (new Set(acronym).size === 1) {
    errors.acronym = "As três letras não podem ser todas iguais.";
  } else if (name !== "" && !acronymMatchesName(name, acronym)) {
    errors.acronym =
      "A sigla começa na primeira letra do nome e tem as outras na ordem do nome.";
  }

  return errors;
}

export function toCreateClubInput(values: ClubFormValues): CreateClubInput {
  return { name: normalizeName(values.name), acronym: values.acronym };
}