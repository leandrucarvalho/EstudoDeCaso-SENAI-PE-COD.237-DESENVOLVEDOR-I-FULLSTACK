import type { Formation as DbFormation } from '../generated/prisma/client.js';
import type { FormationName } from '../domain/lineup-rules.js';

const TO_DB: Record<FormationName, DbFormation> = {
  '3-1': 'F_3_1',
  '2-2': 'F_2_2',
  '2-1-1': 'F_2_1_1',
  '1-2-1': 'F_1_2_1',
};

const FROM_DB: Record<DbFormation, FormationName> = {
  F_3_1: '3-1',
  F_2_2: '2-2',
  F_2_1_1: '2-1-1',
  F_1_2_1: '1-2-1',
};

export function formationToDb(formation: FormationName): DbFormation {
  return TO_DB[formation];
}

export function formationFromDb(formation: DbFormation): FormationName {
  return FROM_DB[formation];
}
