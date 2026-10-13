import { compareNames } from '../common/text.js';

export interface StandingsClub {
  id: number;
  name: string;
}

export interface PlayedMatch {
  homeClubId: number;
  awayClubId: number;
  homeGoals: number;
  awayGoals: number;
}

export interface StandingRow {
  position: number;
  clubId: number;
  clubName: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

const WIN_POINTS = 3;
const DRAW_POINTS = 1;

function emptyRow(club: StandingsClub): StandingRow {
  return {
    position: 0,
    clubId: club.id,
    clubName: club.name,
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,
  };
}

function register(
  row: StandingRow,
  goalsFor: number,
  goalsAgainst: number,
): void {
  row.played += 1;
  row.goalsFor += goalsFor;
  row.goalsAgainst += goalsAgainst;
  if (goalsFor > goalsAgainst) {
    row.wins += 1;
    row.points += WIN_POINTS;
  } else if (goalsFor === goalsAgainst) {
    row.draws += 1;
    row.points += DRAW_POINTS;
  } else {
    row.losses += 1;
  }
}

/** RN21: pontos, saldo de gols, gols marcados e nome do clube; todos os clubes aparecem. */
export function buildStandings(
  clubs: StandingsClub[],
  matches: PlayedMatch[],
): StandingRow[] {
  const rows = new Map(clubs.map((club) => [club.id, emptyRow(club)]));

  for (const match of matches) {
    const home = rows.get(match.homeClubId);
    const away = rows.get(match.awayClubId);
    if (!home || !away) continue;
    register(home, match.homeGoals, match.awayGoals);
    register(away, match.awayGoals, match.homeGoals);
  }

  const sorted = [...rows.values()];
  for (const row of sorted)
    row.goalDifference = row.goalsFor - row.goalsAgainst;

  sorted.sort(
    (a, b) =>
      b.points - a.points ||
      b.goalDifference - a.goalDifference ||
      b.goalsFor - a.goalsFor ||
      compareNames(a.clubName, b.clubName) ||
      a.clubId - b.clubId,
  );
  sorted.forEach((row, index) => (row.position = index + 1));
  return sorted;
}
