import { toApiDateTime } from "@/lib/format";

// Só para validar e orientar; quem decide é a API (RN de fidelidade).
export const MAX_LOYALTY_DAYS = 1095;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface LoyaltyValues {
  date: string;
  time: string;
}

export type LoyaltyErrors = Partial<Record<keyof LoyaltyValues, string>>;

/** Sugestão inicial: daqui a um ano, às 15:00. */
export function defaultLoyalty(now: Date = new Date()): LoyaltyValues {
  const next = new Date(now.getTime() + 365 * DAY_MS);
  const month = String(next.getMonth() + 1).padStart(2, "0");
  const day = String(next.getDate()).padStart(2, "0");
  return { date: `${next.getFullYear()}-${month}-${day}`, time: "15:00" };
}

/** O fuso é fixo (Brasília), como a API exige. */
export function loyaltyMoment({ date, time }: LoyaltyValues): number {
  return Date.parse(toApiDateTime(date, time));
}

export function validateLoyalty(
  values: LoyaltyValues,
  now: Date = new Date(),
): LoyaltyErrors {
  const errors: LoyaltyErrors = {};

  if (values.date === "") errors.date = "Informe a data.";
  if (values.time === "") errors.time = "Informe o horário.";
  if (errors.date || errors.time) return errors;

  const moment = loyaltyMoment(values);
  if (Number.isNaN(moment)) {
    errors.date = "Data ou horário inválido.";
  } else if (moment <= now.getTime()) {
    errors.date = "O fim da fidelidade deve ser no futuro.";
  } else if (moment > now.getTime() + MAX_LOYALTY_DAYS * DAY_MS) {
    errors.date = "No máximo 1.095 dias a partir de agora.";
  }

  return errors;
}