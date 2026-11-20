import type { FastifyInstance } from 'fastify';
import { parseOrThrow } from '../http/validate.js';
import { quoteFor } from '../services/pricingService.js';
import { toQuoteResponse } from './presenters.js';
import { pricingPreviewQuerySchema } from './schemas/pricingSchemas.js';

/** Vista previa sin guardar, para el slider: la lógica de tramos vive solo en el backend. */
export function registerPricingRoutes(app: FastifyInstance): void {
  app.get('/pricing/preview', (request) => {
    const { users, country } = parseOrThrow(pricingPreviewQuerySchema, request.query);
    return toQuoteResponse(quoteFor(users, country));
  });
}
