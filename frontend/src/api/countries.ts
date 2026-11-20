import { request } from './http';
import type { Country } from './types';

/** Países soportados con su tasa de impuesto, desde la configuración del backend. */
export function listCountries(signal?: AbortSignal): Promise<Country[]> {
  return request<Country[]>('/countries', { signal });
}
