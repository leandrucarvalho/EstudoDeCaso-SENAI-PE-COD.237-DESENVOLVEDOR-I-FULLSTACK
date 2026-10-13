const BRT_OFFSET_MINUTES = -3 * 60;
const INPUT_FORMAT = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})-03:00$/;

/**
 * RN01: lê `AAAA-MM-DDTHH:MM-03:00`. Formato diferente ou data/hora inexistente
 * (como 2027-02-30 ou 24:00) devolve `null`, nunca um valor ajustado.
 */
export function parseBrtDateTime(text: string): Date | null {
  const match = INPUT_FORMAT.exec(text);
  if (!match) return null;

  const [year, month, day, hour, minute] = match.slice(1).map(Number);
  if (hour > 23 || minute > 59) return null;

  const utc = new Date(Date.UTC(year, month - 1, day, hour, minute));
  const sameDate =
    utc.getUTCFullYear() === year &&
    utc.getUTCMonth() === month - 1 &&
    utc.getUTCDate() === day;
  if (!sameDate) return null;

  return new Date(utc.getTime() - BRT_OFFSET_MINUTES * 60_000);
}

/** Formato das respostas: `AAAA-MM-DDTHH:MM:SS-03:00` (horário de Brasília, sem horário de verão). */
export function formatBrtDateTime(instant: Date): string {
  const shifted = new Date(instant.getTime() + BRT_OFFSET_MINUTES * 60_000);
  return `${shifted.toISOString().slice(0, 19)}-03:00`;
}
