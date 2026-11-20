import { useMemo, useState, type ReactNode } from 'react';
import type { RatesLoader } from '../../api/exchangeRates';
import { BASE_CURRENCY, SUPPORTED_CURRENCIES, type CurrencyCode } from '../../config/currencies';
import { useExchangeRates } from '../../hooks/useExchangeRates';
import { formatMoney } from '../../utils/money';
import { CurrencyContext, type CurrencyContextValue } from './currencyContext';

interface CurrencyProviderProps {
  children: ReactNode;
  /** Solo para tests: sustituye la carga real de tipos de cambio. */
  loadRates?: RatesLoader;
}

/** Divisa global de visualización. Si no hay tipos de cambio, todo se muestra en EUR (fallback, spec §7). */
export function CurrencyProvider({ children, loadRates }: CurrencyProviderProps) {
  const { state, retry } = useExchangeRates(loadRates);
  const [selected, setSelected] = useState<CurrencyCode>(BASE_CURRENCY);

  const value = useMemo<CurrencyContextValue>(() => {
    const rates = state.status === 'ready' ? state.rates : { [BASE_CURRENCY]: 1 };
    const available = SUPPORTED_CURRENCIES.filter((code) => rates[code] !== undefined);
    const rate = rates[selected];
    const currency = rate === undefined ? BASE_CURRENCY : selected;
    const activeRate = rate ?? 1;

    return {
      currency,
      available,
      setCurrency: setSelected,
      ratesStatus: state.status,
      retryRates: retry,
      formatCents: (cents) => formatMoney(cents, currency, activeRate),
    };
  }, [state, selected, retry]);

  return <CurrencyContext value={value}>{children}</CurrencyContext>;
}
