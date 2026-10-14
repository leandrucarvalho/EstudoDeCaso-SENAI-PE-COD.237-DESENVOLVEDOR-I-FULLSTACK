export type Position = 'GOL' | 'ZAG' | 'LAT' | 'MEI' | 'ATA';
export type Condition = 'APTO' | 'MAL_CONDICIONADO' | 'DOENTE';

export type PlayerSort =
  | 'name'
  | 'value_asc'
  | 'value_desc'
  | 'age_asc'
  | 'age_desc'
  | 'position';

export interface Player {
  id: number;
  name: string;
  position: Position;
  agility: number;
  age: number;
  condition: Condition;
  base_value: number;
  market_value: number;
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
  potential: number;
  overall: number;
  club_id: number | null;
}

export interface PageMeta {
  page: number;
  limit: number;
  total_items: number;
  total_pages: number;
}

export interface PlayersPage {
  data: Player[];
  meta: PageMeta;
}

export interface CreatePlayerInput {
  name: string;
  position: Position;
  agility: number;
  age: number;
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
  potential: number;
}

export type UpdatePlayerInput = Pick<
  CreatePlayerInput,
  'name' | 'position' | 'agility' | 'age'
>;

/** Os nomes seguem os query params da API (snake_case). */
export type PlayerFilters = {
  search?: string;
  position?: Position;
  condition?: Condition;
  free?: boolean;
  club_id?: number;
  min_age?: number;
  max_age?: number;
  min_value?: number;
  max_value?: number;
  sort?: PlayerSort[];
  page?: number;
  limit?: number;
};