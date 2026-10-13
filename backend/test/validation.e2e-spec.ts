import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { type TestApp, createTestApp, newPlayer } from './support/test-app.js';

describe('Validação e erros (V1 a V9)', () => {
  let testApp: TestApp;

  beforeAll(async () => {
    testApp = await createTestApp();
  });
  afterAll(() => testApp.close());
  beforeEach(() => testApp.reset());

  const api = () => testApp.http;

  it('recusa corpo que não é um objeto JSON (V1)', async () => {
    for (const body of ['[]', '"x"', '10', '{invalido']) {
      const response = await api()
        .post('/api/v1/players')
        .set('Content-Type', 'application/json')
        .send(body);
      expect(response.status, body).toBe(400);
      expect(response.headers['content-type']).toContain('application/json');
      expect(response.body.message).toEqual(expect.any(String));
      expect(JSON.stringify(response.body)).not.toContain('at ');
    }
  });

  it.each([
    ['número como texto (V2)', { agility: '85' }],
    ['inteiro com parte fracionária (V2)', { age: 25.5 }],
    ['posição em minúsculas (V5)', { position: 'mei' }],
    ['campo obrigatório nulo (V6)', { pace: null }],
    ['nome com uma palavra só', { name: 'Madonna' }],
    ['nome com dígito', { name: 'Meia Lua 2' }],
    ['nome com caractere de controle (V4)', { name: 'Meia\tLua' }],
    [
      'agilidade acima de 85 com 35 anos',
      { age: 35, agility: 90, potential: 86 },
    ],
    [
      'soma dos atributos acima de 480',
      {
        pace: 99,
        shooting: 99,
        passing: 99,
        dribbling: 99,
        defending: 99,
        physical: 99,
        potential: 99,
      },
    ],
    ['potencial menor que o maior atributo', { potential: 80 }],
    [
      'potencial diferente do maior atributo aos 33 anos',
      { age: 33, potential: 90 },
    ],
  ])('recusa cadastro de jogador: %s', async (_name, overrides) => {
    const response = await api()
      .post('/api/v1/players')
      .send(newPlayer(overrides));
    expect(response.status).toBe(400);
    expect(response.body.message).toEqual(expect.any(String));

    const list = await api().get('/api/v1/players');
    expect(list.body.meta.total_items).toBe(0);
  });

  it('normaliza espaços do nome (V4) e ignora campos calculados (V7)', async () => {
    const response = await api()
      .post('/api/v1/players')
      .send(
        newPlayer({
          name: '  Meia   Lua ',
          base_value: 999,
          club_id: 7,
          condition: 'DOENTE',
          overall: 1,
        }),
      );
    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      name: 'Meia Lua',
      base_value: 40,
      condition: 'APTO',
      club_id: null,
      overall: 75,
    });
  });

  it.each(['abc', '0', '-1', '1.5', '01', '2147483648'])(
    'trata o id %s na URL como inexistente (V8)',
    async (id) => {
      const response = await api().get(`/api/v1/players/${id}`);
      expect(response.status).toBe(404);
      expect(response.body.message).toEqual(expect.any(String));
    },
  );

  it('responde 404 em JSON para caminho fora do enunciado', async () => {
    const response = await api().get('/api/v1/inexistente');
    expect(response.status).toBe(404);
    expect(response.body.message).toEqual(expect.any(String));
  });

  it('valida clubes: nome, sigla e unicidade (RN10)', async () => {
    const bad = [
      { name: 'Aguias', acronym: 'AGU' },
      { name: 'Águias FC', acronym: 'agu' },
      { name: 'Águias FC', acronym: 'XYZ' },
      { name: 'Águias FC', acronym: 'AAA' },
      { name: 'Águias 2 FC', acronym: 'AGU' },
    ];
    for (const body of bad) {
      const response = await api().post('/api/v1/clubs').send(body);
      expect(response.status, JSON.stringify(body)).toBe(400);
    }

    expect(
      (
        await api()
          .post('/api/v1/clubs')
          .send({ name: 'Águias FC', acronym: 'AGU' })
      ).status,
    ).toBe(201);
    expect(
      (
        await api()
          .post('/api/v1/clubs')
          .send({ name: '  águias   fc ', acronym: 'AFC' })
      ).status,
    ).toBe(409);
    expect(
      (
        await api()
          .post('/api/v1/clubs')
          .send({ name: 'Aguias FC', acronym: 'AFC' })
      ).status,
    ).toBe(201);
    expect(
      (
        await api()
          .post('/api/v1/clubs')
          .send({ name: 'Águias Reais', acronym: 'AGU' })
      ).status,
    ).toBe(409);
  });

  it('limita a liga a 20 clubes (RN10)', async () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let index = 0; index < 20; index++) {
      const name = `Clube ${letters[index]}${letters[(index + 1) % 26]} FC`;
      const response = await api()
        .post('/api/v1/clubs')
        .send({
          name,
          acronym: `C${letters[index]}${letters[(index + 1) % 26]}`,
        });
      expect(response.status, name).toBe(201);
    }
    const extra = await api()
      .post('/api/v1/clubs')
      .send({ name: 'Clube Extra FC', acronym: 'CEX' });
    expect(extra.status).toBe(409);
  });

  it('valida os query params da listagem de jogadores', async () => {
    for (const query of [
      'position=mei',
      'position=',
      'limit=51',
      'limit=0',
      'page=01',
      'sort=value_asc,value_desc',
      'sort=POSITION',
      'min_age=30&max_age=20',
      'min_value=10.555',
      'min_value=-1',
      'free=TRUE',
      'search=a',
      'free=true&club_id=1',
    ]) {
      const response = await api().get(`/api/v1/players?${query}`);
      expect(response.status, query).toBe(400);
    }
    expect((await api().get('/api/v1/players?club_id=999')).status).toBe(404);
    expect((await api().get('/api/v1/players?foo=bar')).status).toBe(200);
  });

  it('pagina e ordena a listagem de jogadores (RN07)', async () => {
    for (const [name, age] of [
      ['Ana Lima', 30],
      ['Ana-Maria Souza', 20],
      ['Joao Silva', 25],
    ] as const) {
      await api().post('/api/v1/players').send(newPlayer({ name, age }));
    }

    const byName = await api().get('/api/v1/players?sort=name&limit=2&page=1');
    expect(byName.body.data.map((p: { name: string }) => p.name)).toEqual([
      'Ana Lima',
      'Ana-Maria Souza',
    ]);
    expect(byName.body.meta).toEqual({
      page: 1,
      limit: 2,
      total_items: 3,
      total_pages: 2,
    });

    const beyond = await api().get('/api/v1/players?limit=2&page=5');
    expect(beyond.status).toBe(200);
    expect(beyond.body.data).toEqual([]);
    expect(beyond.body.meta.total_pages).toBe(2);

    const search = await api().get('/api/v1/players?search=JOAO');
    expect(search.body.data.map((p: { name: string }) => p.name)).toEqual([
      'Joao Silva',
    ]);

    const byAge = await api().get('/api/v1/players?sort=age_desc');
    expect(byAge.body.data.map((p: { age: number }) => p.age)).toEqual([
      30, 25, 20,
    ]);
  });

  it('exclui logicamente só jogador livre (RN09)', async () => {
    await api().post('/api/v1/players').send(newPlayer());
    await api()
      .post('/api/v1/clubs')
      .send({ name: 'Águias FC', acronym: 'AGU' });
    await api()
      .post('/api/v1/players/1/buy')
      .send({ club_id: 1, loyalty_until: '2027-03-02T10:15-03:00' });

    expect((await api().delete('/api/v1/players/1')).status).toBe(409);
    await api().post('/api/v1/players/1/sell');

    const removed = await api().delete('/api/v1/players/1');
    expect(removed.status).toBe(204);
    expect(removed.text).toBe('');
    expect((await api().get('/api/v1/players/1')).status).toBe(404);
    expect((await api().delete('/api/v1/players/1')).status).toBe(404);
    expect((await api().get('/api/v1/players')).body.meta.total_items).toBe(0);
    expect(
      (await api().get('/api/v1/clubs/1/transactions?player_id=1')).status,
    ).toBe(404);
  });
});
