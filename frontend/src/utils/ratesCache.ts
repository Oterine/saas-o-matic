import { EXCHANGE_RATES_TTL_MS, SUPPORTED_CURRENCIES, type CurrencyCode } from '../config/currencies';

export type ExchangeRates = Partial<Record<CurrencyCode, number>>;

interface Snapshot {
  rates: ExchangeRates;
  fetchedAt: number;
}

const STORAGE_KEY = 'saas-o-matic:exchange-rates';

function isSnapshot(value: unknown): value is Snapshot {
  if (typeof value !== 'object' || value === null) return false;
  const { rates, fetchedAt } = value as Partial<Snapshot>;
  if (typeof fetchedAt !== 'number' || typeof rates !== 'object' || rates === null) return false;
  return SUPPORTED_CURRENCIES.every((code) => rates[code] === undefined || typeof rates[code] === 'number');
}

/** localStorage puede no existir o lanzar (modo privado, cookies bloqueadas...). */
export function safeLocalStorage(): Storage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

/**
 * Caché de tipos de cambio con caducidad. Usa `storage` si funciona y, si no, se queda en memoria,
 * así que la aplicación funciona igual aunque localStorage falle.
 */
export function createRatesCache(storage: Storage | undefined, ttlMs = EXCHANGE_RATES_TTL_MS) {
  let memory: Snapshot | undefined;

  function readStorage(): Snapshot | undefined {
    try {
      const parsed: unknown = JSON.parse(storage?.getItem(STORAGE_KEY) ?? 'null');
      return isSnapshot(parsed) ? parsed : undefined;
    } catch {
      return undefined;
    }
  }

  return {
    /** Tipos vigentes, o undefined si no hay o han caducado. */
    read(now: number): ExchangeRates | undefined {
      const snapshot = readStorage() ?? memory;
      if (!snapshot) return undefined;
      const age = now - snapshot.fetchedAt;
      return age >= 0 && age < ttlMs ? snapshot.rates : undefined;
    },

    write(rates: ExchangeRates, now: number): void {
      memory = { rates, fetchedAt: now };
      try {
        storage?.setItem(STORAGE_KEY, JSON.stringify(memory));
      } catch {
        // Sin espacio o sin permiso: la copia en memoria basta para esta sesión.
      }
    },
  };
}

export type RatesCache = ReturnType<typeof createRatesCache>;
