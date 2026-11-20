import type { FastifyInstance } from 'fastify';
import { TAX_RATE_PERCENT_BY_COUNTRY } from '../config/taxRates.js';
import { toTaxRate } from './presenters.js';

export interface CountryResponse {
  code: string;
  taxRate: number;
}

/** Países soportados desde la configuración del backend, para que el frontend no duplique la tabla (spec §3.2). */
export function registerCountryRoutes(app: FastifyInstance): void {
  const countries: CountryResponse[] = Object.entries(TAX_RATE_PERCENT_BY_COUNTRY)
    .map(([code, percent]) => ({ code, taxRate: toTaxRate(percent) }))
    .sort((a, b) => a.code.localeCompare(b.code));

  app.get('/countries', () => countries);
}
