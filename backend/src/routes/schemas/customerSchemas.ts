import { z } from 'zod';
import { PLANS } from '../../config/plans.js';
import type { NewCustomer } from '../../domain/customer.js';
import { validateTaxId, type TaxIdResult } from '../../domain/taxId.js';
import { ValidationError } from '../../http/errors.js';
import { toFieldErrors, VALIDATION_MESSAGE } from '../../http/validate.js';
import { requiredText, supportedCountry } from './fields.js';

const newCustomerSchema = z.object(
  {
    companyName: requiredText('El nombre de la empresa').max(200, {
      error: 'El nombre de la empresa no puede superar los 200 caracteres',
    }),
    taxId: requiredText('El identificador fiscal'),
    contactEmail: requiredText('El email de contacto').pipe(
      z.email({ error: 'El email de contacto no tiene un formato válido' }).max(254, {
        error: 'El email de contacto no puede superar los 254 caracteres',
      }),
    ),
    country: supportedCountry,
    plan: z.enum(PLANS, {
      error: (issue) =>
        issue.input === undefined ? 'El plan es obligatorio' : 'El plan debe ser starter, business o enterprise',
    }),
  },
  { error: 'El cuerpo de la petición debe ser un objeto JSON' },
);

/** `?search=` opcional. Más de 200 caracteres no puede coincidir con ningún nombre (spec §3.5). */
export const customerSearchQuerySchema = z.object({
  search: z
    .string({ error: 'El texto de búsqueda debe aparecer una sola vez' })
    .max(200, { error: 'El texto de búsqueda no puede superar los 200 caracteres' })
    .optional(),
});

const taxIdInputSchema = z.object({ taxId: requiredText('El identificador fiscal'), country: supportedCountry });

/** Valida el identificador con el algoritmo del país, si ambos campos son utilizables. */
function checkTaxId(body: unknown): TaxIdResult | undefined {
  const input = taxIdInputSchema.safeParse(body);
  return input.success ? validateTaxId(input.data.taxId, input.data.country) : undefined;
}

/**
 * Valida el alta de un cliente. El identificador fiscal depende del país, así que se comprueba aparte
 * para devolver todos los errores a la vez y no solo los del primer intento.
 */
export function parseNewCustomer(body: unknown): NewCustomer {
  const result = newCustomerSchema.safeParse(body);
  const taxId = checkTaxId(body);
  const fields = result.success ? {} : toFieldErrors(result.error);

  if (taxId && !taxId.valid) {
    fields.taxId ??= taxId.reason ?? 'El identificador fiscal no es válido';
  }
  if (!result.success || !taxId?.valid) {
    throw new ValidationError(VALIDATION_MESSAGE, fields);
  }
  return { ...result.data, taxId: taxId.normalized };
}
