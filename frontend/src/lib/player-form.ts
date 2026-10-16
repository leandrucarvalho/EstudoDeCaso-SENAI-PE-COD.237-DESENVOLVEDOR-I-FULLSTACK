import type {
    CreatePlayerInput,
    Player,
    Position,
    UpdatePlayerInput,
  } from "@/types/player";
  
  export const ATTRIBUTE_FIELDS = [
    "pace",
    "shooting",
    "passing",
    "dribbling",
    "defending",
    "physical",
  ] as const;
  
  export type AttributeField = (typeof ATTRIBUTE_FIELDS)[number];
  
  export const ATTRIBUTE_LABELS: Record<AttributeField, string> = {
    pace: "Velocidade",
    shooting: "Finalização",
    passing: "Passe",
    dribbling: "Drible",
    defending: "Defesa",
    physical: "Físico",
  };
  
  export type PlayerFormField =
    | "name"
    | "position"
    | "age"
    | "agility"
    | AttributeField
    | "potential"
    | "attributes";
  
  /** Os campos de número ficam como texto: o campo mostra exatamente o que foi digitado. */
  export interface PlayerFormValues {
    name: string;
    position: Position | "";
    age: string;
    agility: string;
    pace: string;
    shooting: string;
    passing: string;
    dribbling: string;
    defending: string;
    physical: string;
    potential: string;
  }
  
  export type PlayerFormErrors = Partial<Record<PlayerFormField, string>>;
  
  export const EMPTY_FORM: PlayerFormValues = {
    name: "",
    position: "",
    age: "",
    agility: "",
    pace: "",
    shooting: "",
    passing: "",
    dribbling: "",
    defending: "",
    physical: "",
    potential: "",
  };
  
  export const MAX_ATTRIBUTE_SUM = 480;
  
  const INTEGER_PATTERN = /^\d+$/;
  
  export function formFromPlayer(player: Player): PlayerFormValues {
    return {
      name: player.name,
      position: player.position,
      age: String(player.age),
      agility: String(player.agility),
      pace: String(player.pace),
      shooting: String(player.shooting),
      passing: String(player.passing),
      dribbling: String(player.dribbling),
      defending: String(player.defending),
      physical: String(player.physical),
      potential: String(player.potential),
    };
  }
  
  /** Número inteiro dentro da faixa, ou `null` se o texto não servir. */
  export function parseInteger(
    text: string,
    min: number,
    max: number,
  ): number | null {
    const trimmed = text.trim();
    if (!INTEGER_PATTERN.test(trimmed)) return null;
  
    const value = Number(trimmed);
    return value >= min && value <= max ? value : null;
  }
  
  export function normalizeName(name: string): string {
    return name.trim().replace(/\s+/g, " ");
  }
  
  interface ValidateOptions {
    /** Presente na edição: só nome, posição, idade e agilidade são editáveis. */
    player?: Player;
  }
  
  /**
   * Espelha as regras da API (o backend continua sendo a fonte da verdade).
   * Roda a cada tecla; quem chama decide quais erros mostrar.
   */
  export function validatePlayerForm(
    values: PlayerFormValues,
    { player }: ValidateOptions = {},
  ): PlayerFormErrors {
    const errors: PlayerFormErrors = {};
  
    // Nome
    const name = normalizeName(values.name);
    if (name === "") {
      errors.name = "Informe o nome.";
    } else if (Array.from(name).length < 3 || Array.from(name).length > 100) {
      errors.name = "Use de 3 a 100 caracteres.";
    } else if (/[0-9]/.test(name)) {
      errors.name = "O nome não pode ter números.";
    } else if (name.split(" ").length < 2) {
      errors.name = "Informe nome e sobrenome.";
    }
  
    // Posição
    if (values.position === "") {
      errors.position = "Escolha a posição.";
    } else if (
      player &&
      player.club_id !== null &&
      values.position !== player.position
    ) {
      errors.position = "Jogador com clube não troca de posição.";
    }
  
    // Idade
    const age = parseInteger(values.age, 16, 45);
    if (values.age.trim() === "") {
      errors.age = "Informe a idade.";
    } else if (age === null) {
      errors.age = "Use uma idade de 16 a 45 anos.";
    } else if (player && age < player.age) {
      errors.age = `A idade não pode diminuir (atual: ${player.age}).`;
    }
  
    // Agilidade
    const agility = parseInteger(values.agility, 1, 100);
    if (values.agility.trim() === "") {
      errors.agility = "Informe a agilidade.";
    } else if (agility === null) {
      errors.agility = "Use um valor de 1 a 100.";
    } else if (age !== null && age >= 35 && agility > 85) {
      errors.agility = "Com 35 anos ou mais, a agilidade vai até 85.";
    }
  
    // Na edição, indicadores e potencial não mudam.
    if (player) return errors;
  
    // Seis atributos
    const attributes: number[] = [];
    for (const field of ATTRIBUTE_FIELDS) {
      const text = values[field];
      const value = parseInteger(text, 1, 99);
  
      if (text.trim() === "") {
        errors[field] = "Informe o valor.";
      } else if (value === null) {
        errors[field] = "Use um valor de 1 a 99.";
      } else {
        attributes.push(value);
      }
    }
  
    const allAttributesValid = attributes.length === ATTRIBUTE_FIELDS.length;
    const total = attributes.reduce((sum, value) => sum + value, 0);
    const highest = Math.max(...attributes);
  
    if (allAttributesValid && total > MAX_ATTRIBUTE_SUM) {
      errors.attributes = `A soma dos seis atributos não pode passar de ${MAX_ATTRIBUTE_SUM} (agora: ${total}).`;
    }
  
    // Potencial
    const potential = parseInteger(values.potential, 1, 99);
    if (values.potential.trim() === "") {
      errors.potential = "Informe o potencial.";
    } else if (potential === null) {
      errors.potential = "Use um valor de 1 a 99.";
    } else if (allAttributesValid && potential < highest) {
      errors.potential = `Não pode ser menor que o maior atributo (${highest}).`;
    } else if (
      allAttributesValid &&
      age !== null &&
      age >= 33 &&
      potential !== highest
    ) {
      errors.potential = `Com 33 anos ou mais, é igual ao maior atributo (${highest}).`;
    }
  
    return errors;
  }
  
  export function toCreateInput(values: PlayerFormValues): CreatePlayerInput {
    return {
      name: normalizeName(values.name),
      position: values.position as Position,
      age: Number(values.age),
      agility: Number(values.agility),
      pace: Number(values.pace),
      shooting: Number(values.shooting),
      passing: Number(values.passing),
      dribbling: Number(values.dribbling),
      defending: Number(values.defending),
      physical: Number(values.physical),
      potential: Number(values.potential),
    };
  }
  
  export function toUpdateInput(values: PlayerFormValues): UpdatePlayerInput {
    return {
      name: normalizeName(values.name),
      position: values.position as Position,
      age: Number(values.age),
      agility: Number(values.agility),
    };
  }