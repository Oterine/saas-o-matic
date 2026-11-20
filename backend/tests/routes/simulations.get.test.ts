import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestApp, type TestApp } from '../helpers/testApp.js';

let t: TestApp;
let customerId: number;

const get = (url: string) => t.app.inject({ method: 'GET', url });

async function simulate(activeUsers: number) {
  const res = await t.app.inject({
    method: 'POST',
    url: '/simulations',
    payload: { customerId, activeUsers, storageGb: 10, apiCalls: 1000 },
  });
  return res.json();
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

describe('GET /customers/:id/simulations', () => {
  it('devuelve una lista vacía si el cliente no tiene simulaciones', async () => {
    const res = await get(`/customers/${customerId}/simulations`);
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual([]);
  });

  it('devuelve el historial de la más reciente a la más antigua, con el formato de la API', async () => {
    const first = await simulate(10);
    const second = await simulate(51);

    const res = await get(`/customers/${customerId}/simulations`);
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual([second, first]);
    expect(res.json()[0]).toMatchObject({ activeUsers: 51, baseCents: 42500, taxRate: 0.21, currency: 'EUR' });
  });

  it('404 si el cliente no existe', async () => {
    const res = await get('/customers/999/simulations');
    expect(res.statusCode).toBe(404);
    expect(res.json()).toEqual({ error: { code: 'NOT_FOUND', message: 'Cliente no encontrado' } });
  });

  it('422 si el id no es válido', async () => {
    const res = await get('/customers/abc/simulations');
    expect(res.statusCode).toBe(422);
    expect(res.json().error.fields).toEqual({ id: 'El identificador del cliente no es válido' });
  });
});
