import type { FastifyInstance } from 'fastify';
import { parseOrThrow } from '../http/validate.js';
import type { CustomerRepository } from '../repositories/customerRepository.js';
import { CustomerNotFoundError } from '../services/errors.js';
import { customerSearchQuerySchema, parseNewCustomer } from './schemas/customerSchemas.js';
import { customerIdParamsSchema } from './schemas/params.js';

export interface CustomerRouteDeps {
  customers: CustomerRepository;
}

export function registerCustomerRoutes(app: FastifyInstance, { customers }: CustomerRouteDeps): void {
  app.post('/customers', (request, reply) => {
    const customer = customers.create(parseNewCustomer(request.body));
    return reply.status(201).send(customer);
  });

  app.get('/customers', (request) => {
    const { search } = parseOrThrow(customerSearchQuerySchema, request.query);
    return customers.search(search);
  });

  app.get('/customers/:id', (request) => {
    const { id } = parseOrThrow(customerIdParamsSchema, request.params);
    const customer = customers.findById(id);
    if (!customer) throw new CustomerNotFoundError(id);
    return customer;
  });
}
