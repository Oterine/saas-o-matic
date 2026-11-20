import { getTaxRatePercent } from '../config/taxRates.js';
import { calculateQuote, type Quote } from '../domain/pricing.js';

export interface CountryQuote extends Quote {
  activeUsers: number;
  /** Tasa aplicada, en porcentaje entero (21 = 21 %). */
  taxRatePercent: number;
}

/**
 * Presupuesto para un número de usuarios con la tasa del país. Lo usan la vista previa y las
 * simulaciones guardadas, así que ambas calculan exactamente igual.
 */
export function quoteFor(activeUsers: number, country: string): CountryQuote {
  const taxRatePercent = getTaxRatePercent(country);
  if (taxRatePercent === undefined) {
    // La entrada ya se valida contra la tabla de tasas: llegar aquí es una configuración incoherente (500).
    throw new Error(`No hay tasa de impuesto configurada para ${country}`);
  }
  return { activeUsers, taxRatePercent, ...calculateQuote(activeUsers, taxRatePercent) };
}
