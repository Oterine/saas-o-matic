import Fastify, { type FastifyInstance, type FastifyServerOptions } from 'fastify';
import type { Db } from './db/connection.js';
import { NotFoundError, toErrorResponse } from './http/errors.js';
import { createCustomerRepository } from './repositories/customerRepository.js';
import { registerCustomerRoutes } from './routes/customers.js';

export interface AppOptions {
  db: Db;
  logger?: FastifyServerOptions['logger'];
}

/** Compone la aplicación. La BD se inyecta para poder usar una en memoria en los tests. */
export function buildApp({ db, logger = false }: AppOptions): FastifyInstance {
  const app = Fastify({ logger });

  app.setErrorHandler((error, request, reply) => {
    const { statusCode, body } = toErrorResponse(error);
    if (statusCode >= 500) request.log.error(error);
    return reply.status(statusCode).send(body);
  });

  app.setNotFoundHandler((request, reply) => {
    const { statusCode, body } = toErrorResponse(
      new NotFoundError(`Ruta no encontrada: ${request.method} ${request.url}`),
    );
    return reply.status(statusCode).send(body);
  });

  registerCustomerRoutes(app, { customers: createCustomerRepository(db) });

  return app;
}
