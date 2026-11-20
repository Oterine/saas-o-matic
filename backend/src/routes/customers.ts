import type { FastifyInstance } from 'fastify';
import type { CustomerRepository } from '../repositories/customerRepository.js';
import { parseNewCustomer } from './schemas/customerSchemas.js';

export interface CustomerRouteDeps {
  customers: CustomerRepository;
}

export function registerCustomerRoutes(app: FastifyInstance, { customers }: CustomerRouteDeps): void {
  app.post('/customers', (request, reply) => {
    const customer = customers.create(parseNewCustomer(request.body));
    return reply.status(201).send(customer);
  });
}
