import type { Customer } from '../domain/customer.js';
import type { Simulation } from '../domain/simulation.js';
import type { CustomerRepository } from '../repositories/customerRepository.js';
import type { SimulationRepository } from '../repositories/simulationRepository.js';
import { CustomerNotFoundError } from './errors.js';
import { quoteFor } from './pricingService.js';

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
  function requireCustomer(customerId: number): Customer {
    const customer = customers.findById(customerId);
    if (!customer) throw new CustomerNotFoundError(customerId);
    return customer;
  }

  return {
    /** Calcula el presupuesto con la tasa del país del cliente y lo guarda. Lanza CustomerNotFoundError si no existe. */
    create(request: SimulationRequest): Simulation {
      const customer = requireCustomer(request.customerId);
      const quote = quoteFor(request.activeUsers, customer.country);
      return simulations.create({ ...request, ...quote });
    },

    /** Historial del cliente, de la más reciente a la más antigua. Lanza CustomerNotFoundError si no existe. */
    listForCustomer(customerId: number): Simulation[] {
      requireCustomer(customerId);
      return simulations.listByCustomer(customerId);
    },
  };
}

export type SimulationService = ReturnType<typeof createSimulationService>;
