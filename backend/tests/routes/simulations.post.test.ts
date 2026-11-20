import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createSimulationRepository } from '../../src/repositories/simulationRepository.js';
import { createTestApp, type TestApp } from '../helpers/testApp.js';

let t: TestApp;
let customerId: number;

const valid = () => ({ customerId, activeUsers: 15, storageGb: 100, apiCalls: 50000 });

const post = (payload: unknown) => t.app.inject({ method: 'POST', url: '/simulations', payload: payload as object });

async function expect422(payload: unknown) {
  const res = await post(payload);
  expect(res.statusCode).toBe(422);
  const { error } = res.json();
  expect(error.code).toBe('VALIDATION_ERROR');
  return error.fields as Record<string, string>;
}

beforeEach(async () => {
  t = createTestApp();
  const res = await t.app.inject({
    method: 'POST',
    url: '/customers',
    payload: { companyName: 'Acme S.L.', taxId: 'B12345674', contactEmail: 'ops@acme.es', country: 'ES', plan: 'business' },
  });
  customerId = res.json().id;
});

afterEach(async () => {
  await t.close();
});

describe('POST /simulations: 201', () => {
  it('responde como el ejemplo de la spec §6', async () => {
    const res = await post(valid());
    expect(res.statusCode).toBe(201);
    expect(res.json()).toEqual({
      id: 1,
      customerId,
      activeUsers: 15,
      storageGb: 100,
      apiCalls: 50000,
      baseCents: 14000,
      taxRate: 0.21,
      taxCents: 2940,
      totalCents: 16940,
      currency: 'EUR',
      createdAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/),
    });
  });

  it('persiste la simulación', async () => {
    const { id } = (await post(valid())).json();
    expect(createSimulationRepository(t.db).listByCustomer(customerId).map((s) => s.id)).toEqual([id]);
  });

  it.each([
    ['0 usuarios', { activeUsers: 0 }, 0],
    ['100 000 usuarios', { activeUsers: 100_000 }, 42000 + (100_000 - 50) * 500],
    ['almacenamiento con 2 decimales (0.29)', { storageGb: 0.29 }, 14000],
    ['almacenamiento y llamadas a 0', { storageGb: 0, apiCalls: 0 }, 14000],
  ])('acepta el límite: %s', async (_label, overrides, baseCents) => {
    const res = await post({ ...valid(), ...overrides });
    expect(res.statusCode).toBe(201);
    expect(res.json().baseCents).toBe(baseCents);
  });
});

describe('POST /simulations: 404', () => {
  it('cliente inexistente', async () => {
    const res = await post({ ...valid(), customerId: 999 });
    expect(res.statusCode).toBe(404);
    expect(res.json()).toEqual({ error: { code: 'NOT_FOUND', message: 'Cliente no encontrado' } });
  });
});

describe('POST /simulations: 422', () => {
  it.each([
    ['usuarios negativos', { activeUsers: -1 }, 'activeUsers', 'El número de usuarios no puede ser negativo'],
    ['usuarios decimales', { activeUsers: 1.5 }, 'activeUsers', 'El número de usuarios debe ser un número entero'],
    ['más de 100 000 usuarios', { activeUsers: 100_001 }, 'activeUsers', 'El número de usuarios no puede superar 100.000'],
    ['usuarios como texto', { activeUsers: '15' }, 'activeUsers', 'El número de usuarios debe ser un número'],
    ['almacenamiento negativo', { storageGb: -0.5 }, 'storageGb', 'El almacenamiento no puede ser negativo'],
    ['almacenamiento con 3 decimales', { storageGb: 1.234 }, 'storageGb', 'El almacenamiento admite como máximo 2 decimales'],
    ['almacenamiento excesivo', { storageGb: 1_000_001 }, 'storageGb', 'El almacenamiento no puede superar 1.000.000'],
    ['llamadas decimales', { apiCalls: 10.5 }, 'apiCalls', 'El número de llamadas a la API debe ser un número entero'],
    ['llamadas negativas', { apiCalls: -1 }, 'apiCalls', 'El número de llamadas a la API no puede ser negativo'],
    ['cliente no entero', { customerId: 1.5 }, 'customerId', 'El cliente debe ser un identificador válido'],
    ['cliente 0', { customerId: 0 }, 'customerId', 'El cliente debe ser un identificador válido'],
    ['cliente negativo', { customerId: -3 }, 'customerId', 'El cliente debe ser un identificador válido'],
    ['cliente como texto', { customerId: '1' }, 'customerId', 'El cliente debe ser un identificador válido'],
    ['cliente gigante', { customerId: 2 ** 60 }, 'customerId', 'El cliente debe ser un identificador válido'],
  ])('%s', async (_label, overrides, field, message) => {
    expect(await expect422({ ...valid(), ...overrides })).toEqual({ [field]: message });
  });

  it('campos obligatorios ausentes', async () => {
    expect(await expect422({})).toEqual({
      customerId: 'El cliente es obligatorio',
      activeUsers: 'El número de usuarios es obligatorio',
      storageGb: 'El almacenamiento es obligatorio',
      apiCalls: 'El número de llamadas a la API es obligatorio',
    });
  });
});
