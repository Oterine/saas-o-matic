import { getExchangeRates, type RatesLoader } from '../api/exchangeRates';
import type { ExchangeRates } from '../utils/ratesCache';
import { useAsync } from './useAsync';

export type ExchangeRatesState =
  | { status: 'loading' }
  | { status: 'ready'; rates: ExchangeRates }
  | { status: 'error' };

/** Carga los tipos de cambio al montar, con reintento manual. El cargador se inyecta en los tests. */
export function useExchangeRates(loader: RatesLoader = getExchangeRates) {
  const { status, data, retry } = useAsync(loader);

  const state: ExchangeRatesState =
    status === 'success' && data ? { status: 'ready', rates: data } : { status: status === 'error' ? 'error' : 'loading' };

  return { state, retry };
}
