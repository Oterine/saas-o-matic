import { describe, expect, it, vi } from 'vitest';
import { createRatesCache } from '../utils/ratesCache';
import { getExchangeRates, parseRatesResponse } from './exchangeRates';

const apiBody = {
  result: 'success',
  base_code: 'EUR',
  rates: { EUR: 1, USD: 1.08, GBP: 0.85, CHF: 0.95, JPY: 160.5, MXN: 18.2, AED: 3.97 },
};

describe('parseRatesResponse', () => {
  it('se queda solo con las divisas soportadas', () => {
    expect(parseRatesResponse(apiBody)).toEqual({ EUR: 1, USD: 1.08, GBP: 0.85, CHF: 0.95, JPY: 160.5, MXN: 18.2 });
  });

  it('descarta tipos ausentes, no numéricos o no positivos', () => {
    const body = { ...apiBody, rates: { USD: '1.08', GBP: 0, CHF: -1, JPY: Number.NaN } };
    expect(parseRatesResponse(body)).toEqual({ EUR: 1 });
  });

  it.each([
    ['resultado de error', { result: 'error', 'error-type': 'unsupported-code' }],
    ['otra divisa base', { ...apiBody, base_code: 'USD' }],
    ['sin rates', { result: 'success', base_code: 'EUR' }],
    ['no es un objeto', 'texto'],
    ['null', null],
  ])('rechaza una respuesta no válida: %s', (_label, body) => {
    expect(() => parseRatesResponse(body)).toThrow('Respuesta de tipos de cambio no válida');
  });
});

describe('getExchangeRates', () => {
  const rates = { EUR: 1, USD: 1.1 };

  it('usa la caché vigente sin llamar a la API', async () => {
    const cache = createRatesCache(undefined);
    cache.write(rates, 1000);
    const fetcher = vi.fn();

    await expect(getExchangeRates(undefined, { cache, now: () => 2000, fetcher })).resolves.toEqual(rates);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('sin caché, llama a la API y guarda el resultado', async () => {
    const cache = createRatesCache(undefined);
    const fetcher = vi.fn().mockResolvedValue(rates);

    await expect(getExchangeRates(undefined, { cache, now: () => 5000, fetcher })).resolves.toEqual(rates);
    expect(fetcher).toHaveBeenCalledOnce();
    expect(cache.read(5000)).toEqual(rates);
  });

  it('propaga el error de la API sin guardar nada', async () => {
    const cache = createRatesCache(undefined);
    const fetcher = vi.fn().mockRejectedValue(new Error('caída'));

    await expect(getExchangeRates(undefined, { cache, now: () => 0, fetcher })).rejects.toThrow('caída');
    expect(cache.read(0)).toBeUndefined();
  });
});
