import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { type TestApp, createTestApp } from './support/test-app.js';

type Position = 'GOL' | 'ZAG' | 'LAT' | 'MEI' | 'ATA';

function starter(
  name: string,
  position: Position,
  attributes: Partial<
    Record<'shooting' | 'passing' | 'dribbling' | 'defending', number>
  >,
) {
  const base = {
    pace: 50,
    shooting: 50,
    passing: 50,
    dribbling: 50,
    defending: 50,
    physical: 50,
  };
  const merged = { ...base, ...attributes };
  return {
    name,
    position,
    agility: 70,
    age: 25,
    ...merged,
    potential: Math.max(...Object.values(merged)),
  };
}

// Elencos do exemplo da RN20 (Águias FC x Delta FC, os dois no 2-1-1).
const EAGLES = [
  starter('Rui Prado', 'GOL', { defending: 77 }),
  starter('Téo Brandão', 'ZAG', { defending: 84 }),
  starter('Davi Lins', 'LAT', { dribbling: 74, defending: 66 }),
  starter('Lauro Neves', 'MEI', { passing: 82 }),
  starter('Otto Rangel', 'ATA', { shooting: 75 }),
];
const DELTA = [
  starter('Ivo Teles', 'GOL', { defending: 72 }),
  starter('Hugo Vaz', 'ZAG', { defending: 84 }),
  starter('Lino Matos', 'LAT', { dribbling: 79, defending: 63 }),
  starter('Nei Soares', 'MEI', { passing: 70 }),
  starter('Ugo Falcão', 'ATA', { shooting: 81 }),
];

const LOYALTY = '2027-03-02T10:15-03:00';

describe('Liga: escalação, partidas e classificação', () => {
  let testApp: TestApp;

  beforeAll(async () => {
    testApp = await createTestApp();
  });
  afterAll(() => testApp.close());
  beforeEach(() => testApp.reset());

  const api = () => testApp.http;

  async function createClub(name: string, acronym: string): Promise<number> {
    const response = await api().post('/api/v1/clubs').send({ name, acronym });
    expect(response.status).toBe(201);
    return response.body.id;
  }

  async function signSquad(
    clubId: number,
    squad: ReturnType<typeof starter>[],
  ): Promise<number[]> {
    const ids: number[] = [];
    for (const player of squad) {
      const created = await api().post('/api/v1/players').send(player);
      expect(created.status).toBe(201);
      const bought = await api()
        .post(`/api/v1/players/${created.body.id}/buy`)
        .send({ club_id: clubId, loyalty_until: LOYALTY });
      expect(bought.status, player.name).toBe(200);
      ids.push(created.body.id);
    }
    return ids;
  }

  it('escala, joga a partida do exemplo da RN20 e monta a classificação', async () => {
    const eaglesId = await createClub('Águias FC', 'AGU');
    const deltaId = await createClub('Delta FC', 'DFC');
    const eagles = await signSquad(eaglesId, EAGLES);
    const delta = await signSquad(deltaId, DELTA);

    const davi = eagles[2];
    expect(
      (
        await api()
          .patch(`/api/v1/players/${davi}/condition`)
          .send({ condition: 'MAL_CONDICIONADO' })
      ).status,
    ).toBe(200);

    const empty = await api().get(`/api/v1/clubs/${eaglesId}/lineup`);
    expect(empty.body).toEqual({
      club_id: eaglesId,
      formation: null,
      complete: false,
      players: [],
    });

    const early = await api()
      .post('/api/v1/matches')
      .send({ home_club_id: eaglesId, away_club_id: deltaId });
    expect(early.status).toBe(409);

    const first = await api()
      .put(`/api/v1/clubs/${eaglesId}/lineup`)
      .send({ formation: '2-1-1', player_ids: [...eagles].reverse() });
    expect(first.status).toBe(200);
    expect(first.body.complete).toBe(true);
    expect(
      first.body.players.map((p: { position: string }) => p.position),
    ).toEqual(['GOL', 'ZAG', 'LAT', 'MEI', 'ATA']);
    expect(
      (
        await api()
          .put(`/api/v1/clubs/${deltaId}/lineup`)
          .send({ formation: '2-1-1', player_ids: delta })
      ).status,
    ).toBe(200);

    const played = await api()
      .post('/api/v1/matches')
      .send({ home_club_id: eaglesId, away_club_id: deltaId });
    expect(played.status).toBe(201);
    expect(played.headers.location).toBe('/api/v1/matches/1');
    expect(played.body.home).toMatchObject({
      club_name: 'Águias FC',
      formation: '2-1-1',
      goals: 1,
    });
    expect(played.body.away).toMatchObject({
      club_name: 'Delta FC',
      formation: '2-1-1',
      goals: 2,
    });
    expect(played.body.result).toBe('VISITANTE');
    expect(played.body.duels.map((d: { order: number }) => d.order)).toEqual([
      1, 2, 3, 4, 5, 6,
    ]);
    expect(played.body.duels.map((d: { goal: boolean }) => d.goal)).toEqual([
      true,
      false,
      false,
      true,
      false,
      true,
    ]);
    expect(played.body.duels[2]).toMatchObject({
      attacking_club_id: eaglesId,
      attacker: {
        player_name: 'Davi Lins',
        attribute: 'dribbling',
        value: 63,
        condition: 'MAL_CONDICIONADO',
      },
      defender: {
        player_name: 'Lino Matos',
        attribute: 'defending',
        value: 63,
      },
      goal: false,
    });

    // Sem sorteio: o mesmo confronto repete o placar.
    const again = await api()
      .post('/api/v1/matches')
      .send({ home_club_id: eaglesId, away_club_id: deltaId });
    expect(again.body.home.goals).toBe(1);
    expect(again.body.away.goals).toBe(2);

    const list = await api().get('/api/v1/matches');
    expect(list.body.map((m: { id: number }) => m.id)).toEqual([2, 1]);
    expect(list.body[0].duels).toBeUndefined();
    const detail = await api().get('/api/v1/matches/1');
    expect(detail.body.duels).toHaveLength(6);

    const gamaId = await createClub('Gama SC', 'GSC');
    expect((await api().get(`/api/v1/matches?club_id=${gamaId}`)).body).toEqual(
      [],
    );

    const standings = await api().get('/api/v1/standings');
    expect(
      standings.body.map((row: { club_name: string }) => row.club_name),
    ).toEqual(['Delta FC', 'Gama SC', 'Águias FC']);
    expect(standings.body[0]).toMatchObject({
      position: 1,
      played: 2,
      wins: 2,
      goals_for: 4,
      goals_against: 2,
      goal_difference: 2,
      points: 6,
    });
    expect(standings.body[1]).toMatchObject({
      position: 2,
      played: 0,
      points: 0,
    });
  });

  it('valida a escalação (RN19)', async () => {
    const eaglesId = await createClub('Águias FC', 'AGU');
    const deltaId = await createClub('Delta FC', 'DFC');
    const eagles = await signSquad(eaglesId, EAGLES);
    const delta = await signSquad(deltaId, DELTA);
    const url = `/api/v1/clubs/${eaglesId}/lineup`;

    const cases: [string, unknown, number][] = [
      ['formação fora da lista', { formation: '4-0', player_ids: eagles }, 400],
      ['só 4 ids', { formation: '2-1-1', player_ids: eagles.slice(0, 4) }, 400],
      [
        'ids repetidos',
        { formation: '2-1-1', player_ids: [...eagles.slice(0, 4), eagles[0]] },
        400,
      ],
      [
        'id negativo',
        { formation: '2-1-1', player_ids: [...eagles.slice(0, 4), -1] },
        400,
      ],
      [
        'jogador inexistente',
        { formation: '2-1-1', player_ids: [...eagles.slice(0, 4), 9999] },
        404,
      ],
      [
        'jogador de outro clube',
        { formation: '2-1-1', player_ids: [...eagles.slice(0, 4), delta[4]] },
        409,
      ],
      [
        'posições que não fecham a formação',
        { formation: '3-1', player_ids: eagles },
        409,
      ],
    ];
    for (const [label, body, status] of cases) {
      const response = await api()
        .put(url)
        .send(body as object);
      expect(response.status, label).toBe(status);
    }
    expect((await api().get(url)).body.formation).toBeNull();
  });

  it('tira o titular da escalação ao vender ou ao ficar DOENTE (RN19)', async () => {
    const eaglesId = await createClub('Águias FC', 'AGU');
    const deltaId = await createClub('Delta FC', 'DFC');
    const eagles = await signSquad(eaglesId, EAGLES);
    const delta = await signSquad(deltaId, DELTA);
    await api()
      .put(`/api/v1/clubs/${eaglesId}/lineup`)
      .send({ formation: '2-1-1', player_ids: eagles });
    await api()
      .put(`/api/v1/clubs/${deltaId}/lineup`)
      .send({ formation: '2-1-1', player_ids: delta });

    const sick = await api()
      .patch(`/api/v1/players/${eagles[3]}/condition`)
      .send({ condition: 'DOENTE' });
    expect(sick.status).toBe(200);

    const afterSick = await api().get(`/api/v1/clubs/${eaglesId}/lineup`);
    expect(afterSick.body.formation).toBe('2-1-1');
    expect(afterSick.body.complete).toBe(false);
    expect(afterSick.body.players).toHaveLength(4);

    const blocked = await api()
      .post('/api/v1/matches')
      .send({ home_club_id: eaglesId, away_club_id: deltaId });
    expect(blocked.status).toBe(409);

    const sold = await api().post(`/api/v1/players/${eagles[4]}/sell`);
    expect(sold.status).toBe(200);
    expect(
      (await api().get(`/api/v1/clubs/${eaglesId}/lineup`)).body.players,
    ).toHaveLength(3);

    const backToApto = await api()
      .patch(`/api/v1/players/${eagles[3]}/condition`)
      .send({ condition: 'APTO' });
    expect(backToApto.status).toBe(409);
  });

  it('valida a partida (400 e 404)', async () => {
    const clubId = await createClub('Águias FC', 'AGU');
    for (const body of [
      { home_club_id: clubId, away_club_id: clubId },
      { home_club_id: 0, away_club_id: clubId },
      { home_club_id: clubId },
    ]) {
      expect((await api().post('/api/v1/matches').send(body)).status).toBe(400);
    }
    expect(
      (
        await api()
          .post('/api/v1/matches')
          .send({ home_club_id: clubId, away_club_id: 999 })
      ).status,
    ).toBe(404);
    expect((await api().get('/api/v1/matches/999')).status).toBe(404);
  });
});
