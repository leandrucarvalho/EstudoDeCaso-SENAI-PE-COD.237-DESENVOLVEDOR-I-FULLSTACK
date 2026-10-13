import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { type TestApp, createTestApp, newPlayer } from './support/test-app.js';

describe('Mercado (cenário do enunciado: Meia Lua no Águias FC)', () => {
  let testApp: TestApp;

  beforeAll(async () => {
    testApp = await createTestApp();
  });
  afterAll(() => testApp.close());
  beforeEach(() => testApp.reset());

  const api = () => testApp.http;

  it('percorre cadastro, compra, consulta do clube, venda, histórico e CSV', async () => {
    const created = await api().post('/api/v1/players').send(newPlayer());
    expect(created.status).toBe(201);
    expect(created.headers.location).toBe('/api/v1/players/1');
    expect(created.body).toMatchObject({
      id: 1,
      condition: 'APTO',
      base_value: 40,
      market_value: 40,
      overall: 75,
      club_id: null,
    });

    const club = await api()
      .post('/api/v1/clubs')
      .send({ name: 'Águias FC', acronym: 'AGU' });
    expect(club.status).toBe(201);
    expect(club.headers.location).toBe('/api/v1/clubs/1');
    expect(club.body).toMatchObject({
      cash: 300,
      squad_value: 0,
      net_worth: 300,
    });

    const sick = await api()
      .patch('/api/v1/players/1/condition')
      .send({ condition: 'MAL_CONDICIONADO' });
    expect(sick.status).toBe(200);
    expect(sick.body.market_value).toBe(37);

    testApp.clock.set('2026-11-02T13:15:00Z');
    const bought = await api()
      .post('/api/v1/players/1/buy')
      .send({ club_id: 1, loyalty_until: '2027-03-02T10:15-03:00' });
    expect(bought.status).toBe(200);
    expect(bought.body).toMatchObject({
      type: 'COMPRA',
      value: 37,
      fee: 1.85,
      penalty: 0,
      profit: null,
      cash_change: -38.85,
      created_at: '2026-11-02T10:15:00-03:00',
      club_cash: 261.15,
      contract: {
        purchase_value: 37,
        loyalty_until: '2027-03-02T10:15:00-03:00',
        status: 'ATIVO',
      },
    });

    const detail = await api().get('/api/v1/clubs/1');
    expect(detail.status).toBe(200);
    expect(detail.body).toMatchObject({
      cash: 261.15,
      squad_value: 37,
      net_worth: 298.15,
    });
    expect(detail.body.players[0].contract).toEqual({
      purchase_value: 37,
      loyalty_until: '2027-03-02T10:15:00-03:00',
      remaining_days: 120,
      penalty_rate: 10,
    });

    await api()
      .patch('/api/v1/players/1/condition')
      .send({ condition: 'APTO' });

    testApp.clock.set('2026-11-05T19:40:00Z');
    const sold = await api().post('/api/v1/players/1/sell');
    expect(sold.status).toBe(200);
    expect(sold.body).toMatchObject({
      type: 'VENDA',
      value: 40,
      fee: 0.3,
      penalty: 4,
      profit: 3,
      cash_change: 35.7,
      created_at: '2026-11-05T16:40:00-03:00',
      purchase_value: 37,
      remaining_days: 117,
      penalty_rate: 10,
      contract_status: 'RESCINDIDO',
      club_cash: 296.85,
    });

    const history = await api().get('/api/v1/clubs/1/transactions');
    expect(history.status).toBe(200);
    expect(history.body.data.map((t: { type: string }) => t.type)).toEqual([
      'VENDA',
      'COMPRA',
    ]);
    expect(history.body.summary).toEqual({
      total_spent: 38.85,
      total_received: 35.7,
      total_fees: 2.15,
      total_penalties: 4,
      total_profit: 3,
    });

    const onlySales = await api().get(
      '/api/v1/clubs/1/transactions?type=VENDA',
    );
    expect(onlySales.body.summary.total_spent).toBe(0);

    const csv = await api().get('/api/v1/clubs/1/transactions/export');
    expect(csv.status).toBe(200);
    expect(csv.headers['content-type']).toContain('text/csv');
    expect(csv.text).toBe(
      'data_hora;tipo;jogador;valor;taxa_ou_comissao;multa;lucro;variacao_caixa\n' +
        '2026-11-05T16:40:00-03:00;VENDA;Meia Lua;40,00;0,30;4,00;3,00;35,70\n' +
        '2026-11-02T10:15:00-03:00;COMPRA;Meia Lua;37,00;1,85;0,00;;-38,85\n',
    );

    const rebuy = await api()
      .post('/api/v1/players/1/buy')
      .send({ club_id: 1, loyalty_until: '2027-03-02T10:15-03:00' });
    expect(rebuy.status).toBe(409);
    expect(rebuy.body.message).toEqual(expect.any(String));
  });

  it('recusa compra acima de 50% do caixa sem gravar nada', async () => {
    await api()
      .post('/api/v1/clubs')
      .send({ name: 'Águias FC', acronym: 'AGU' });
    // valor base alto: overall 85+ com 27 anos → valor de mercado 100,00 (taxa 5,00 → 105,00)
    await api()
      .post('/api/v1/players')
      .send(
        newPlayer({
          name: 'Craque Caro',
          position: 'ATA',
          pace: 90,
          shooting: 90,
          passing: 80,
          dribbling: 90,
          defending: 20,
          physical: 80,
          potential: 90,
          age: 27,
        }),
      );
    const ok = await api()
      .post('/api/v1/players/1/buy')
      .send({ club_id: 1, loyalty_until: '2027-03-02T10:15-03:00' });
    expect(ok.status).toBe(200);

    await api()
      .post('/api/v1/players')
      .send(
        newPlayer({
          name: 'Outro Craque',
          position: 'ATA',
          pace: 90,
          shooting: 90,
          passing: 80,
          dribbling: 90,
          defending: 20,
          physical: 80,
          potential: 90,
          age: 27,
        }),
      );
    const refused = await api()
      .post('/api/v1/players/2/buy')
      .send({ club_id: 1, loyalty_until: '2027-03-02T10:15-03:00' });
    expect(refused.status).toBe(409);

    const club = await api().get('/api/v1/clubs/1');
    expect(club.body.players).toHaveLength(1);
    const history = await api().get('/api/v1/clubs/1/transactions');
    expect(history.body.data).toHaveLength(1);
  });

  it('valida a data de fidelidade (RN01)', async () => {
    await api()
      .post('/api/v1/clubs')
      .send({ name: 'Águias FC', acronym: 'AGU' });
    await api().post('/api/v1/players').send(newPlayer());

    for (const loyalty_until of [
      '2027-03-02T10:15',
      '2027-02-30T10:15-03:00',
      '2027-03-02T24:00-03:00',
      '2026-10-01T10:15-03:00',
      '2031-03-02T10:15-03:00',
    ]) {
      const response = await api()
        .post('/api/v1/players/1/buy')
        .send({ club_id: 1, loyalty_until });
      expect(response.status, loyalty_until).toBe(400);
    }
  });
});
