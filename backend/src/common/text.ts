const CONTROL_CHARACTERS = /\p{Cc}/u;

export function hasControlCharacters(text: string): boolean {
  return CONTROL_CHARACTERS.test(text);
}

/** V4: remove espaços do início e do fim e reduz espaços repetidos a um só. */
export function normalizeSpaces(text: string): string {
  return text.replace(/ {2,}/g, ' ').replace(/^ +| +$/g, '');
}

/** Conta pontos de código Unicode, não unidades UTF-16 (definição de "caractere" do enunciado). */
export function countCharacters(text: string): number {
  return Array.from(text).length;
}

export function countWords(text: string): number {
  return text.split(' ').filter((word) => /\p{L}/u.test(word)).length;
}

/** Remove acentos: decompõe em NFD e descarta as marcas (categoria Mn), inclusive a cedilha. */
export function removeAccents(text: string): string {
  return text.normalize('NFD').replace(/\p{Mn}/gu, '');
}

/** Forma usada em buscas e na ordem alfabética: sem acentos e em minúsculas. */
export function toComparable(text: string): string {
  return removeAccents(text).toLowerCase();
}

/**
 * Ordem alfabética do enunciado: compara os pontos de código de `toComparable`
 * (espaço vem antes do hífen, e o hífen antes das letras).
 */
export function compareNames(first: string, second: string): number {
  const a = Array.from(toComparable(first));
  const b = Array.from(toComparable(second));
  const length = Math.min(a.length, b.length);
  for (let index = 0; index < length; index++) {
    const difference = a[index].codePointAt(0)! - b[index].codePointAt(0)!;
    if (difference !== 0) return difference;
  }
  return a.length - b.length;
}
