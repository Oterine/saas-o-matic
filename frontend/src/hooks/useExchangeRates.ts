import { useCallback, useEffect, useState } from 'react';
import { getExchangeRates, type RatesLoader } from '../api/exchangeRates';
import type { ExchangeRates } from '../utils/ratesCache';

export type ExchangeRatesState =
  | { status: 'loading' }
  | { status: 'ready'; rates: ExchangeRates }
  | { status: 'error' };

/** Carga los tipos de cambio al montar, con reintento manual. El cargador se inyecta en los tests. */
export function useExchangeRates(loader: RatesLoader = getExchangeRates) {
  const [state, setState] = useState<ExchangeRatesState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: 'loading' });

    loader(controller.signal).then(
      (rates) => {
        if (!controller.signal.aborted) setState({ status: 'ready', rates });
      },
      () => {
        if (!controller.signal.aborted) setState({ status: 'error' });
      },
    );

    return () => controller.abort();
  }, [loader, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  return { state, retry };
}
