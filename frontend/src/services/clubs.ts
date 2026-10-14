import { request } from '../lib/http';
import { buildQueryString } from '../lib/query';
import type { Club, ClubDetail, ClubSort, CreateClubInput } from '../types/club';

export function listClubs(sort?: ClubSort): Promise<Club[]> {
  return request<Club[]>(`/clubs${buildQueryString({ sort })}`);
}

export function getClub(id: number): Promise<ClubDetail> {
  return request<ClubDetail>(`/clubs/${id}`);
}

export function createClub(input: CreateClubInput): Promise<Club> {
  return request<Club>('/clubs', { method: 'POST', body: input });
}