export const EMPTY = "–";

// Sinal de menos tipográfico (U+2212), o do design; não é o hífen do teclado.
const MINUS = "−";

// Criados uma vez: construir Intl a cada chamada é caro.
const moneyFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const integerFormatter = new Intl.NumberFormat("pt-BR");

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

type Maybe<T> = T | null | undefined;

export function formatMoney(value: Maybe<number>): string {
  if (value == null) return EMPTY;
  return moneyFormatter.format(value);
}

export function formatSignedMoney(value: Maybe<number>): string {
  if (value == null) return EMPTY;

  const text = moneyFormatter.format(Math.abs(value));
  if (text === "0,00") return text;

  return `${value > 0 ? "+" : MINUS}${text}`;
}

export function formatSignedInteger(value: Maybe<number>): string {
  if (value == null) return EMPTY;
  if (value === 0) return "0";

  return `${value > 0 ? "+" : MINUS}${integerFormatter.format(Math.abs(value))}`;
}

export function formatPercent(value: Maybe<number>): string {
  if (value == null) return EMPTY;
  return `${integerFormatter.format(value)}%`;
}

export function formatDays(value: Maybe<number>): string {
  if (value == null) return EMPTY;
  return `${integerFormatter.format(value)} ${value === 1 ? "dia" : "dias"}`;
}

export function formatDateTime(iso: Maybe<string>): string {
  if (iso == null) return EMPTY;

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return EMPTY;

  const parts: Record<string, string> = {};
  for (const part of dateTimeFormatter.formatToParts(date)) {
    parts[part.type] = part.value;
  }

  return `${parts.day}/${parts.month}/${parts.year} ${parts.hour}:${parts.minute}`;
}

// A API (RN01) exige `AAAA-MM-DDTHH:MM-03:00`. Montamos a string na mão
// para o fuso do navegador não interferir.
export function toApiDateTime(date: string, time: string): string {
  return `${date}T${time}-03:00`;
}

export function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return EMPTY;

  const first = words[0].charAt(0);
  const last = words.length > 1 ? words[words.length - 1].charAt(0) : "";

  return `${first}${last}`.toLocaleUpperCase("pt-BR");
}
