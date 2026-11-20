import { getTaxRatePercent } from '../config/taxRates.js';
import { calculateQuote } from '../domain/pricing.js';
import type { Simulation } from '../domain/simulation.js';
import type { CustomerRepository } from '../repositories/customerRepository.js';
import type { SimulationRepository } from '../repositories/simulationRepository.js';
import { CustomerNotFoundError } from './errors.js';

export interface SimulationRequest {
  customerId: number;
  activeUsers: number;
  storageGb: number;
  apiCalls: number;
}

export interface SimulationServiceDeps {
  customers: CustomerRepository;
  simulations: SimulationRepository;
}

export function createSimulationService({ customers, simulations }: SimulationServiceDeps) {
  return {
    /** Calcula el presupuesto con la tasa del país del cliente y lo guarda. Lanza CustomerNotFoundError si no existe. */
    create(request: SimulationRequest): Simulation {
      const customer = customers.findById(request.customerId);
      if (!customer) throw new CustomerNotFoundError(request.customerId);

      const taxRatePercent = getTaxRatePercent(customer.country);
      if (taxRatePercent === undefined) {
        // El alta solo admite países con tasa, así que esto indica una configuración incoherente (500).
        throw new Error(`No hay tasa de impuesto configurada para ${customer.country}`);
      }

      const quote = calculateQuote(request.activeUsers, taxRatePercent);
      return simulations.create({ ...request, ...quote, taxRatePercent });
    },
  };
}

export type SimulationService = ReturnType<typeof createSimulationService>;
