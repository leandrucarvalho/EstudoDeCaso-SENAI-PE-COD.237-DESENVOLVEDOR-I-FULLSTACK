import { request } from '../lib/http';
import { buildQueryString } from '../lib/query';
import type {
  Lineup,
  LineupInput,
  Match,
  MatchSummary,
  PlayMatchInput,
  Standing,
} from '../types/league';

export function getLineup(clubId: number): Promise<Lineup> {
  return request<Lineup>(`/clubs/${clubId}/lineup`);
}

export function saveLineup(clubId: number, input: LineupInput): Promise<Lineup> {
  return request<Lineup>(`/clubs/${clubId}/lineup`, {
    method: 'PUT',
    body: input,
  });
}

export function playMatch(input: PlayMatchInput): Promise<Match> {
  return request<Match>('/matches', { method: 'POST', body: input });
}

export function listMatches(clubId?: number): Promise<MatchSummary[]> {
  return request<MatchSummary[]>(`/matches${buildQueryString({ club_id: clubId })}`);
}

export function getMatch(id: number): Promise<Match> {
  return request<Match>(`/matches/${id}`);
}

export function listStandings(): Promise<Standing[]> {
  return request<Standing[]>('/standings');
}