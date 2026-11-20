import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestApp, type TestApp } from '../helpers/testApp.js';

let t: TestApp;

const valid = {
  companyName: 'Acme S.L.',
  taxId: 'B12345674',
  contactEmail: 'ops@acme.es',
  country: 'ES',
  plan: 'business',
};

const post = (payload: unknown) => t.app.inject({ method: 'POST', url: '/customers', payload: payload as object });

async function expect422(payload: unknown) {
  const res = await post(payload);
  expect(res.statusCode).toBe(422);
  const { error } = res.json();
  expect(error.code).toBe('VALIDATION_ERROR');
  return error.fields as Record<string, string>;
}

beforeEach(() => {
  t = createTestApp();
});

afterEach(async () => {
  await t.close();
});

describe('POST /customers: 201', () => {
  it('crea el cliente del ejemplo de la spec', async () => {
    const res = await post(valid);
    expect(res.statusCode).toBe(201);
    expect(res.json()).toEqual({ id: 1, ...valid, createdAt: expect.stringMatching(/Z$/) });
  });

  it('normaliza identificador, país y espacios', async () => {
    const res = await post({ ...valid, companyName: '  Acme S.L.  ', taxId: 'b-1234.5674', country: 'es' });
    expect(res.statusCode).toBe(201);
    expect(res.json()).toMatchObject({ companyName: 'Acme S.L.', taxId: 'B12345674', country: 'ES' });
  });

  it.each([
    ['DNI', '12345678Z'],
    ['NIE', 'X1234567L'],
    ['CIF con letra', 'Q2826000H'],
  ])('acepta un %s español válido', async (_type, taxId) => {
    expect((await post({ ...valid, taxId })).statusCode).toBe(201);
  });

  it('acepta un nombre de exactamente 200 caracteres', async () => {
    expect((await post({ ...valid, companyName: 'a'.repeat(200) })).statusCode).toBe(201);
  });

  it('fuera de España solo exige el formato genérico', async () => {
    const res = await post({ ...valid, country: 'FR', taxId: 'FR-12345678' });
    expect(res.statusCode).toBe(201);
    expect(res.json()).toMatchObject({ taxId: 'FR12345678', country: 'FR' });
  });
});

describe('POST /customers: 422', () => {
  it('DNI con letra de control incorrecta, con mensaje claro', async () => {
    expect(await expect422({ ...valid, taxId: '12345678A' })).toEqual({
      taxId: 'La letra de control del DNI no es correcta',
    });
  });

  it('CIF con control incorrecto', async () => {
    expect(await expect422({ ...valid, taxId: 'A58818502' })).toHaveProperty('taxId');
  });

  it('identificador genérico demasiado corto fuera de España', async () => {
    expect(await expect422({ ...valid, country: 'FR', taxId: 'ab' })).toHaveProperty('taxId');
  });

  it('email no válido', async () => {
    expect(await expect422({ ...valid, contactEmail: 'no-es-email' })).toEqual({
      contactEmail: 'El email de contacto no tiene un formato válido',
    });
  });

  it('país no soportado', async () => {
    expect(await expect422({ ...valid, country: 'XX' })).toEqual({ country: 'País no soportado' });
  });

  it('plan ausente', async () => {
    const { plan: _omitted, ...withoutPlan } = valid;
    expect(await expect422(withoutPlan)).toEqual({ plan: 'El plan es obligatorio' });
  });

  it('plan no válido', async () => {
    expect(await expect422({ ...valid, plan: 'gold' })).toEqual({
      plan: 'El plan debe ser starter, business o enterprise',
    });
  });

  it('nombre de más de 200 caracteres', async () => {
    expect(await expect422({ ...valid, companyName: 'a'.repeat(201) })).toEqual({
      companyName: 'El nombre de la empresa no puede superar los 200 caracteres',
    });
  });

  it('email de más de 254 caracteres', async () => {
    const longEmail = `${'a'.repeat(64)}@${'b'.repeat(63)}.${'c'.repeat(63)}.${'d'.repeat(60)}.es`;
    expect(longEmail.length).toBeGreaterThan(254);
    expect(await expect422({ ...valid, contactEmail: longEmail })).toEqual({
      contactEmail: 'El email de contacto no puede superar los 254 caracteres',
    });
  });

  it('campos obligatorios ausentes, con mensajes en español', async () => {
    expect(await expect422({})).toEqual({
      companyName: 'El nombre de la empresa es obligatorio',
      taxId: 'El identificador fiscal es obligatorio',
      contactEmail: 'El email de contacto es obligatorio',
      country: 'El país es obligatorio',
      plan: 'El plan es obligatorio',
    });
  });

  it('devuelve a la vez los errores de formato y el del identificador fiscal', async () => {
    const fields = await expect422({ ...valid, contactEmail: 'mal', taxId: '12345678A' });
    expect(Object.keys(fields).sort()).toEqual(['contactEmail', 'taxId']);
  });

  it('campo de texto enviado como array', async () => {
    expect(await expect422({ ...valid, country: ['ES', 'PT'] })).toEqual({ country: 'El país debe ser un único valor' });
  });

  it('cuerpo que no es un objeto', async () => {
    expect(await expect422([1, 2, 3])).toHaveProperty('_');
  });
});

describe('POST /customers: 409', () => {
  it('identificador duplicado aunque esté escrito de otra forma', async () => {
    await post(valid);
    const res = await post({ ...valid, companyName: 'Otra S.A.', taxId: 'b-12345674' });
    expect(res.statusCode).toBe(409);
    expect(res.json()).toMatchObject({ error: { code: 'DUPLICATE_TAX_ID', fields: { taxId: expect.any(String) } } });
  });
});
