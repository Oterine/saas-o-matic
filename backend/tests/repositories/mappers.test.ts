import { describe, expect, it } from 'vitest';
import { mapCustomerRow, toIsoUtc } from '../../src/repositories/mappers.js';

describe('toIsoUtc', () => {
  it('convierte el formato de SQLite a ISO 8601 en UTC', () => {
    expect(toIsoUtc('2026-11-20 10:00:00')).toBe('2026-11-20T10:00:00Z');
  });
});

describe('mapCustomerRow', () => {
  it('pasa de snake_case a camelCase', () => {
    expect(
      mapCustomerRow({
        id: 1,
        company_name: 'Acme S.L.',
        tax_id: 'B12345674',
        contact_email: 'ops@acme.es',
        country: 'ES',
        plan: 'business',
        created_at: '2026-11-20 10:00:00',
      }),
    ).toEqual({
      id: 1,
      companyName: 'Acme S.L.',
      taxId: 'B12345674',
      contactEmail: 'ops@acme.es',
      country: 'ES',
      plan: 'business',
      createdAt: '2026-11-20T10:00:00Z',
    });
  });
});
