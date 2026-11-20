import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { TAX_RATE_PERCENT_BY_COUNTRY } from '../../src/config/taxRates.js';
import { createTestApp, type TestApp } from '../helpers/testApp.js';

let t: TestApp;

beforeEach(() => {
  t = createTestApp();
});

afterEach(async () => {
  await t.close();
});

describe('GET /countries', () => {
  it('devuelve la tabla de la spec §3.2 ordenada por código, con taxRate como fracción', async () => {
    const res = await t.app.inject({ method: 'GET', url: '/countries' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual([
      { code: 'DE', taxRate: 0.19 },
      { code: 'ES', taxRate: 0.21 },
      { code: 'FR', taxRate: 0.2 },
      { code: 'GB', taxRate: 0.2 },
      { code: 'IT', taxRate: 0.22 },
      { code: 'PT', taxRate: 0.23 },
      { code: 'US', taxRate: 0 },
    ]);
  });

  it('incluye todos los países de la configuración (una sola fuente de verdad)', async () => {
    const res = await t.app.inject({ method: 'GET', url: '/countries' });
    const codes = res.json().map((c: { code: string }) => c.code);
    expect(codes.sort()).toEqual(Object.keys(TAX_RATE_PERCENT_BY_COUNTRY).sort());
  });
});
