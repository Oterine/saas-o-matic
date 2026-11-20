import { useContext } from 'react';
import { CurrencyContext, type CurrencyContextValue } from '../features/currency/currencyContext';

export function useCurrency(): CurrencyContextValue {
  const value = useContext(CurrencyContext);
  if (!value) throw new Error('useCurrency debe usarse dentro de <CurrencyProvider>');
  return value;
}
