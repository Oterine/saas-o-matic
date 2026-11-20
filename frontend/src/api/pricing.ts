import { request } from './http';
import type { PricingPreview } from './types';

/** Cálculo sin guardar. La lógica de tramos vive solo en el backend (CLAUDE.md). */
export function getPricingPreview(users: number, country: string, signal?: AbortSignal): Promise<PricingPreview> {
  const query = new URLSearchParams({ users: String(users), country });
  return request<PricingPreview>(`/pricing/preview?${query}`, { signal });
}
