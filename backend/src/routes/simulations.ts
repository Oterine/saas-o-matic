import type { FastifyInstance } from 'fastify';
import { parseOrThrow } from '../http/validate.js';
import type { SimulationService } from '../services/simulationService.js';
import { toSimulationResponse } from './presenters.js';
import { customerIdParamsSchema } from './schemas/params.js';
import { newSimulationSchema } from './schemas/simulationSchemas.js';

export interface SimulationRouteDeps {
  simulationService: SimulationService;
}

export function registerSimulationRoutes(app: FastifyInstance, { simulationService }: SimulationRouteDeps): void {
  app.post('/simulations', (request, reply) => {
    const simulation = simulationService.create(parseOrThrow(newSimulationSchema, request.body));
    return reply.status(201).send(toSimulationResponse(simulation));
  });

  app.get('/customers/:id/simulations', (request) => {
    const { id } = parseOrThrow(customerIdParamsSchema, request.params);
    return simulationService.listForCustomer(id).map(toSimulationResponse);
  });
}
