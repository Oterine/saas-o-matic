import { describe, expect, it } from 'vitest';
import { createRatesCache } from './ratesCache';

const HOUR = 60 * 60 * 1000;
const rates = { EUR: 1, USD: 1.1 };

/** Storage en memoria que implementa solo lo que usa la caché. */
function fakeStorage(initial: Record<string, string> = {}): Storage {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
  } as Storage;
}

/** Storage que falla en todas las operaciones (modo privado, cookies bloqueadas...). */
const brokenStorage = {
  getItem: () => {
    throw new Error('SecurityError');
  },
  setItem: () => {
    throw new Error('QuotaExceededError');
  },
} as unknown as Storage;

describe('createRatesCache', () => {
  it('devuelve undefined si no hay nada guardado', () => {
    expect(createRatesCache(fakeStorage()).read(0)).toBeUndefined();
  });

  it('devuelve los tipos guardados mientras no caduquen', () => {
    const cache = createRatesCache(fakeStorage());
    cache.write(rates, 1000);
    expect(cache.read(1000 + HOUR - 1)).toEqual(rates);
  });

  it('caducan pasada 1 hora', () => {
    const cache = createRatesCache(fakeStorage());
    cache.write(rates, 1000);
    expect(cache.read(1000 + HOUR)).toBeUndefined();
  });

  it('persiste entre instancias a través del storage', () => {
    const storage = fakeStorage();
    createRatesCache(storage).write(rates, 1000);
    expect(createRatesCache(storage).read(2000)).toEqual(rates);
  });

  it('ignora datos corruptos o con otra forma', () => {
    const key = 'saas-o-matic:exchange-rates';
    expect(createRatesCache(fakeStorage({ [key]: '{no es json' })).read(0)).toBeUndefined();
    expect(createRatesCache(fakeStorage({ [key]: '{"rates":{"USD":"1.1"},"fetchedAt":0}' })).read(0)).toBeUndefined();
  });

  it('funciona en memoria si el storage falla o no existe', () => {
    for (const storage of [brokenStorage, undefined]) {
      const cache = createRatesCache(storage);
      cache.write(rates, 1000);
      expect(cache.read(2000)).toEqual(rates);
    }
  });
});
