import { BASE_CURRENCY } from '../config/currency.js';
import type { Simulation } from '../domain/simulation.js';
import type { CountryQuote } from '../services/pricingService.js';

export interface SimulationResponse extends Omit<Simulation, 'taxRatePercent'> {
  /** Fracción (0.21) según el contrato de la spec §6; internamente se guarda el porcentaje entero. */
  taxRate: number;
  currency: typeof BASE_CURRENCY;
}

/** Porcentaje entero → fracción para la API (21 → 0.21). Solo se usa para mostrar, nunca para calcular. */
export const toTaxRate = (percent: number): number => percent / 100;

export interface QuoteResponse extends Omit<CountryQuote, 'taxRatePercent'> {
  taxRate: number;
  currency: typeof BASE_CURRENCY;
}

export function toQuoteResponse({ taxRatePercent, ...quote }: CountryQuote): QuoteResponse {
  return { ...quote, taxRate: toTaxRate(taxRatePercent), currency: BASE_CURRENCY };
}

export function toSimulationResponse({ taxRatePercent, ...simulation }: Simulation): SimulationResponse {
  return { ...simulation, taxRate: toTaxRate(taxRatePercent), currency: BASE_CURRENCY };
}
