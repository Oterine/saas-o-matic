import { getPricingPreview } from '../api/pricing';
import { PREVIEW_DEBOUNCE_MS } from '../config/simulator';
import { useAsync } from './useAsync';
import { useDebouncedValue } from './useDebouncedValue';

/**
 * Presupuesto en tiempo real calculado por el backend (la lógica de tramos no se duplica aquí).
 * `usersText` se envía tal cual: si no es válido, el 422 del backend explica por qué.
 */
export function usePricingPreview(usersText: string, country: string) {
  const users = useDebouncedValue(usersText.trim(), PREVIEW_DEBOUNCE_MS);
  return useAsync((signal) => getPricingPreview(users, country, signal), `${users}|${country}`);
}
