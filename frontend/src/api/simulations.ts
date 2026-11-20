import { request } from './http';
import type { Simulation, SimulationInput } from './types';

/** Guarda una simulación. Acepta campos ausentes: el backend valida y responde 422 por campo. */
export function createSimulation(simulation: SimulationInput): Promise<Simulation> {
  return request<Simulation>('/simulations', { method: 'POST', body: simulation });
}

/** Historial del cliente, de la más reciente a la más antigua. */
export function listSimulations(customerId: number, signal?: AbortSignal): Promise<Simulation[]> {
  return request<Simulation[]>(`/customers/${customerId}/simulations`, { signal });
}
