import { request } from './http';
import type { NewSimulation, Simulation } from './types';

export function createSimulation(simulation: NewSimulation): Promise<Simulation> {
  return request<Simulation>('/simulations', { method: 'POST', body: simulation });
}

/** Historial del cliente, de la más reciente a la más antigua. */
export function listSimulations(customerId: number, signal?: AbortSignal): Promise<Simulation[]> {
  return request<Simulation[]>(`/customers/${customerId}/simulations`, { signal });
}
