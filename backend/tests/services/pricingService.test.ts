import { describe, expect, it } from 'vitest';
import { quoteFor } from '../../src/services/pricingService.js';

describe('quoteFor', () => {
  it('calcula con la tasa del país (ejemplo de la spec)', () => {
    expect(quoteFor(15, 'ES')).toEqual({
      activeUsers: 15,
      taxRatePercent: 21,
      baseCents: 14000,
      taxCents: 2940,
      totalCents: 16940,
    });
  });

  it('lanza un error de configuración si el país no tiene tasa', () => {
    expect(() => quoteFor(15, 'XX')).toThrow(/No hay tasa de impuesto configurada para XX/);
  });
});
