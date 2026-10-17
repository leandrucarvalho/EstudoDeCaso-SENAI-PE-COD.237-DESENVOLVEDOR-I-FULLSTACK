import { ATTRIBUTE_LABELS, type AttributeField } from "@/lib/player-form";
import type { Formation } from "@/types/league";
import type { Player, Position } from "@/types/player";

export const FORMATIONS: Formation[] = ["3-1", "2-2", "2-1-1", "1-2-1"];
export const DEFAULT_FORMATION: Formation = "2-1-1";

export const FORMATION_DESCRIPTIONS: Record<Formation, string> = {
  "3-1": "Defesa 3, ataque 1",
  "2-2": "Defesa 2, ataque 2",
  "2-1-1": "Defesa 2, meio 1, ataque 1",
  "1-2-1": "Defesa 1, meio 2, ataque 1",
};

export type Sector = "GOL" | "DEF" | "MEI" | "ATA";

export interface Slot {
  sector: Sector;
  title: string;
  /** Posições aceitas, só para o texto da vaga. */
  hint: string;
}

const SECTOR_INFO: Record<Sector, Omit<Slot, "sector">> = {
  GOL: { title: "Goleiro", hint: "GOL" },
  DEF: { title: "Defesa", hint: "ZAG ou LAT" },
  MEI: { title: "Meio", hint: "MEI" },
  ATA: { title: "Ataque", hint: "ATA" },
};

const POSITIONS_BY_SECTOR: Record<Sector, Position[]> = {
  GOL: ["GOL"],
  DEF: ["ZAG", "LAT"],
  MEI: ["MEI"],
  ATA: ["ATA"],
};

// Espelha a RN19 da API só para montar as vagas; a API continua recusando o que não encaixa.
const SHAPES: Record<Formation, [number, number, number]> = {
  "3-1": [3, 0, 1],
  "2-2": [2, 0, 2],
  "2-1-1": [2, 1, 1],
  "1-2-1": [1, 2, 1],
};

/** Jogadores por linha, do goleiro ao ataque (ex.: "2-1-1" vira [1, 2, 1, 1]). */
export function formationRows(formation: Formation): number[] {
  const [defense, midfield, attack] = SHAPES[formation];
  return [1, defense, midfield, attack].filter((count) => count > 0);
}

export function slotsFor(formation: Formation): Slot[] {
  const [defense, midfield, attack] = SHAPES[formation];
  const sectors: Sector[] = [
    "GOL",
    ...Array<Sector>(defense).fill("DEF"),
    ...Array<Sector>(midfield).fill("MEI"),
    ...Array<Sector>(attack).fill("ATA"),
  ];
  return sectors.map((sector) => ({ sector, ...SECTOR_INFO[sector] }));
}

export function fitsSector(position: Position, sector: Sector): boolean {
  return POSITIONS_BY_SECTOR[sector].includes(position);
}

/** Distribui os jogadores nas vagas da formação; quem não encaixa fica de fora. */
export function fillSlots(formation: Formation, players: Player[]): string[] {
  const pool = [...players];

  return slotsFor(formation).map((slot) => {
    const index = pool.findIndex((player) =>
      fitsSector(player.position, slot.sector),
    );
    if (index === -1) return "";
    return String(pool.splice(index, 1)[0].id);
  });
}

const POSITION_ORDER: Position[] = ["GOL", "ZAG", "LAT", "MEI", "ATA"];

function compareSquadOrder(a: Player, b: Player): number {
  return (
    POSITION_ORDER.indexOf(a.position) - POSITION_ORDER.indexOf(b.position) ||
    a.name.localeCompare(b.name, "pt-BR")
  );
}

const ATTACK_ATTRIBUTE: Record<Position, AttributeField> = {
  GOL: "defending",
  ZAG: "dribbling",
  LAT: "dribbling",
  MEI: "passing",
  ATA: "shooting",
};

/**
 * Só para mostrar "Atributos usados": espelha o motor da partida (RN20).
 * O goleiro e o 1º de linha só defendem; o 2º defende e ataca; o 3º e o 4º só atacam.
 */
export function usedAttributes(starters: Player[]): Map<number, string[]> {
  const [goalkeeper, ...field] = [...starters].sort(compareSquadOrder);
  const used = new Map<number, string[]>();
  const label = (field: AttributeField, player: Player) =>
    `${ATTRIBUTE_LABELS[field]} ${player[field]}`;

  if (goalkeeper) used.set(goalkeeper.id, [label("defending", goalkeeper)]);
  field.forEach((player, index) => {
    const attack = label(ATTACK_ATTRIBUTE[player.position], player);
    const defense = label("defending", player);
    used.set(
      player.id,
      index === 0 ? [defense] : index === 1 ? [attack, defense] : [attack],
    );
  });

  return used;
}
