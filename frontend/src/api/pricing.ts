import { request } from './http';
import type { PricingPreview } from './types';

/**
 * Cálculo sin guardar. La lógica de tramos vive solo en el backend (CLAUDE.md).
 * `users` admite el texto escrito por el usuario: si no es válido, el backend responde 422 con el motivo.
 */
export function getPricingPreview(
  users: number | string,
  country: string,
  signal?: AbortSignal,
): Promise<PricingPreview> {
  const query = new URLSearchParams({ users: String(users), country });
  return request<PricingPreview>(`/pricing/preview?${query}`, { signal });
}
