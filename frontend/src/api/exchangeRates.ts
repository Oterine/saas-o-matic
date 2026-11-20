import { BASE_CURRENCY, EXCHANGE_RATES_URL, SUPPORTED_CURRENCIES } from '../config/currencies';
import { createRatesCache, safeLocalStorage, type ExchangeRates, type RatesCache } from '../utils/ratesCache';

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

/** Valida la respuesta de open.er-api.com y se queda solo con las divisas soportadas. */
export function parseRatesResponse(body: unknown): ExchangeRates {
  if (!isRecord(body) || body.result !== 'success' || body.base_code !== BASE_CURRENCY || !isRecord(body.rates)) {
    throw new Error('Respuesta de tipos de cambio no válida');
  }

  const supported: ExchangeRates = { [BASE_CURRENCY]: 1 };
  for (const code of SUPPORTED_CURRENCIES) {
    const rate = body.rates[code];
    if (typeof rate === 'number' && Number.isFinite(rate) && rate > 0) supported[code] = rate;
  }
  return supported;
}

/** API externa: no pasa por el cliente del backend (api/http.ts). */
export async function fetchExchangeRates(signal?: AbortSignal): Promise<ExchangeRates> {
  const response = await fetch(EXCHANGE_RATES_URL, { signal });
  if (!response.ok) throw new Error(`La API de tipos de cambio respondió ${response.status}`);
  return parseRatesResponse(await response.json());
}

const defaultCache = createRatesCache(safeLocalStorage());

export interface GetRatesOptions {
  cache?: RatesCache;
  now?: () => number;
  fetcher?: typeof fetchExchangeRates;
}

/** Tipos de cambio desde la caché si siguen vigentes; si no, desde la API externa. */
export async function getExchangeRates(
  signal?: AbortSignal,
  { cache = defaultCache, now = Date.now, fetcher = fetchExchangeRates }: GetRatesOptions = {},
): Promise<ExchangeRates> {
  const cached = cache.read(now());
  if (cached) return cached;

  const rates = await fetcher(signal);
  cache.write(rates, now());
  return rates;
}

export type RatesLoader = (signal: AbortSignal) => Promise<ExchangeRates>;
