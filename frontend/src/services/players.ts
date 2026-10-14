import { request } from '../lib/http';
import { buildQueryString } from '../lib/query';
import type {
  Condition,
  CreatePlayerInput,
  Player,
  PlayerFilters,
  PlayersPage,
  UpdatePlayerInput,
} from '../types/player';

export function listPlayers(filters: PlayerFilters = {}): Promise<PlayersPage> {
  return request<PlayersPage>(`/players${buildQueryString(filters)}`);
}

export function getPlayer(id: number): Promise<Player> {
  return request<Player>(`/players/${id}`);
}

export function createPlayer(input: CreatePlayerInput): Promise<Player> {
  return request<Player>('/players', { method: 'POST', body: input });
}

export function updatePlayer(
  id: number,
  input: UpdatePlayerInput,
): Promise<Player> {
  return request<Player>(`/players/${id}`, { method: 'PUT', body: input });
}

export function changePlayerCondition(
  id: number,
  condition: Condition,
): Promise<Player> {
  return request<Player>(`/players/${id}/condition`, {
    method: 'PATCH',
    body: { condition },
  });
}

export function deletePlayer(id: number): Promise<void> {
  return request<void>(`/players/${id}`, { method: 'DELETE' });
}