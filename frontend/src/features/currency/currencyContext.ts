import { createContext } from 'react';
import type { CurrencyCode } from '../../config/currencies';

export interface CurrencyContextValue {
  /** Divisa en la que se muestran los importes: la elegida, o EUR si no hay tipo de cambio para ella. */
  currency: CurrencyCode;
  /** Divisas que se pueden elegir ahora mismo (solo EUR si los tipos no han cargado). */
  available: readonly CurrencyCode[];
  setCurrency: (currency: CurrencyCode) => void;
  ratesStatus: 'loading' | 'ready' | 'error';
  retryRates: () => void;
  /** Formatea un importe en céntimos de EUR en la divisa activa. */
  formatCents: (cents: number) => string;
}

export const CurrencyContext = createContext<CurrencyContextValue | null>(null);
