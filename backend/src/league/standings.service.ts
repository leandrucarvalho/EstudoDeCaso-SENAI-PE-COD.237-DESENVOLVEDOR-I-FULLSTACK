import { Injectable } from '@nestjs/common';
import { buildStandings } from '../domain/standings.js';
import { ClubsRepository } from '../persistence/clubs.repository.js';
import { MatchesRepository } from '../persistence/matches.repository.js';

export interface StandingResponse {
  position: number;
  club_id: number;
  club_name: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
}

@Injectable()
export class StandingsService {
  constructor(
    private readonly clubs: ClubsRepository,
    private readonly matches: MatchesRepository,
  ) {}

  /** RN21: calculada a cada consulta, nunca gravada. */
  async list(): Promise<StandingResponse[]> {
    const [clubs, matches] = await Promise.all([
      this.clubs.findAll(),
      this.matches.findAllScores(),
    ]);

    return buildStandings(
      clubs.map((club) => ({ id: club.id, name: club.name })),
      matches,
    ).map((row) => ({
      position: row.position,
      club_id: row.clubId,
      club_name: row.clubName,
      played: row.played,
      wins: row.wins,
      draws: row.draws,
      losses: row.losses,
      goals_for: row.goalsFor,
      goals_against: row.goalsAgainst,
      goal_difference: row.goalDifference,
      points: row.points,
    }));
  }
}
