import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestApp, type TestApp } from '../helpers/testApp.js';

let t: TestApp;

const get = (url: string) => t.app.inject({ method: 'GET', url });
const names = (body: { companyName: string }[]) => body.map((c) => c.companyName);

async function createCustomer(companyName: string, taxId: string) {
  const res = await t.app.inject({
    method: 'POST',
    url: '/customers',
    payload: { companyName, taxId, contactEmail: 'a@b.es', country: 'ES', plan: 'starter' },
  });
  return res.json();
}

beforeEach(async () => {
  t = createTestApp();
  await createCustomer('Zeta Logística', 'B12345674');
  await createCustomer('Acme S.L.', 'A58818501');
  await createCustomer('Álvarez y Asociados', 'X1234567L');
});

afterEach(async () => {
  await t.close();
});

describe('GET /customers', () => {
  it('sin search lista todos en orden alfabético, con la forma del cliente', async () => {
    const res = await get('/customers');
    expect(res.statusCode).toBe(200);
    expect(names(res.json())).toEqual(['Acme S.L.', 'Álvarez y Asociados', 'Zeta Logística']);
    expect(res.json()[0]).toEqual({
      id: 2,
      companyName: 'Acme S.L.',
      taxId: 'A58818501',
      contactEmail: 'a@b.es',
      country: 'ES',
      plan: 'starter',
      createdAt: expect.stringMatching(/Z$/),
    });
  });

  it('busca por nombre parcial sin distinguir mayúsculas ni tildes', async () => {
    expect(names((await get('/customers?search=ALVAREZ')).json())).toEqual(['Álvarez y Asociados']);
    expect(names((await get(`/customers?search=${encodeURIComponent('logística')}`)).json())).toEqual([
      'Zeta Logística',
    ]);
  });

  it('busca por identificador fiscal escrito con otro formato', async () => {
    expect(names((await get('/customers?search=a-588')).json())).toEqual(['Acme S.L.']);
  });

  it('devuelve una lista vacía si no hay coincidencias', async () => {
    const res = await get('/customers?search=inexistente');
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual([]);
  });

  it('search vacío equivale a no buscar', async () => {
    expect(names((await get('/customers?search=')).json())).toHaveLength(3);
  });

  it('422 si search supera 200 caracteres', async () => {
    const res = await get(`/customers?search=${'a'.repeat(201)}`);
    expect(res.statusCode).toBe(422);
    expect(res.json().error.fields).toEqual({ search: 'El texto de búsqueda no puede superar los 200 caracteres' });
  });

  it('422 si search aparece repetido', async () => {
    const res = await get('/customers?search=a&search=b');
    expect(res.statusCode).toBe(422);
    expect(res.json().error.fields).toHaveProperty('search');
  });
});

describe('GET /customers/:id', () => {
  it('devuelve el detalle del cliente', async () => {
    const res = await get('/customers/2');
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ id: 2, companyName: 'Acme S.L.', taxId: 'A58818501' });
  });

  it('404 si no existe', async () => {
    const res = await get('/customers/999');
    expect(res.statusCode).toBe(404);
    expect(res.json()).toEqual({ error: { code: 'NOT_FOUND', message: 'Cliente no encontrado' } });
  });

  it.each(['abc', '0', '-1', '1.5', '1e3', '99999999999999999999'])('422 si el id no es válido (%s)', async (id) => {
    const res = await get(`/customers/${id}`);
    expect(res.statusCode).toBe(422);
    expect(res.json().error.fields).toEqual({ id: 'El identificador del cliente no es válido' });
  });
});
