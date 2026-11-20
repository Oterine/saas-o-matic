import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestApp, type TestApp } from '../helpers/testApp.js';

let t: TestApp;

const preview = (query: string) => t.app.inject({ method: 'GET', url: `/pricing/preview?${query}` });

async function expect422(query: string) {
  const res = await preview(query);
  expect(res.statusCode).toBe(422);
  expect(res.json().error.code).toBe('VALIDATION_ERROR');
  return res.json().error.fields as Record<string, string>;
}

beforeEach(() => {
  t = createTestApp();
});

afterEach(async () => {
  await t.close();
});

describe('GET /pricing/preview: tabla de la spec §3.1 (ES, 21 %)', () => {
  // Valores esperados escritos a mano (no recalculados con la fórmula del código).
  it.each([
    [0, 0, 0, 0],
    [1, 1000, 210, 1210],
    [10, 10000, 2100, 12100],
    [11, 10800, 2268, 13068],
    [15, 14000, 2940, 16940],
    [50, 42000, 8820, 50820],
    [51, 42500, 8925, 51425],
    [100, 67000, 14070, 81070],
  ])('%i usuarios → base %i, impuesto %i, total %i céntimos', async (users, baseCents, taxCents, totalCents) => {
    const res = await preview(`users=${users}&country=ES`);
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({
      activeUsers: users,
      baseCents,
      taxRate: 0.21,
      taxCents,
      totalCents,
      currency: 'EUR',
    });
  });
});

describe('GET /pricing/preview: país', () => {
  it.each([
    ['PT', 0.23, 3220],
    ['US', 0, 0],
    ['es', 0.21, 2940],
  ])('aplica la tasa de %s', async (country, taxRate, taxCents) => {
    expect((await preview(`users=15&country=${country}`)).json()).toMatchObject({ baseCents: 14000, taxRate, taxCents });
  });
});

describe('GET /pricing/preview: 422', () => {
  it.each([
    ['users=abc&country=ES', 'El número de usuarios debe ser un número entero mayor o igual que 0'],
    ['users=-1&country=ES', 'El número de usuarios debe ser un número entero mayor o igual que 0'],
    ['users=1.5&country=ES', 'El número de usuarios debe ser un número entero mayor o igual que 0'],
    ['users=&country=ES', 'El número de usuarios debe ser un número entero mayor o igual que 0'],
    ['users=100001&country=ES', 'El número de usuarios no puede superar 100.000'],
    ['users=1&users=2&country=ES', 'El número de usuarios debe ser un único valor'],
  ])('users no válido (%s)', async (query, message) => {
    expect(await expect422(query)).toEqual({ users: message });
  });

  it('country repetido', async () => {
    expect(await expect422('users=5&country=ES&country=PT')).toEqual({ country: 'El país debe ser un único valor' });
  });

  it('acepta el máximo exacto (100 000)', async () => {
    expect((await preview('users=100000&country=ES')).statusCode).toBe(200);
  });

  it('país no soportado', async () => {
    expect(await expect422('users=15&country=XX')).toEqual({ country: 'País no soportado' });
  });

  it('parámetros ausentes', async () => {
    expect(await expect422('')).toEqual({
      users: 'El número de usuarios es obligatorio',
      country: 'El país es obligatorio',
    });
  });
});

describe('GET /pricing/preview: sin efectos', () => {
  it('no guarda nada en la base de datos', async () => {
    await preview('users=15&country=ES');
    const { count } = t.db.prepare('SELECT COUNT(*) AS count FROM simulations').get() as { count: number };
    expect(count).toBe(0);
  });
});
