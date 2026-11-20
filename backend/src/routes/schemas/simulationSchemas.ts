import { z } from 'zod';
import { SIMULATION_LIMITS } from '../../config/limits.js';
import { activeUsersField, hasAtMostDecimals, requiredInteger, requiredNumber } from './fields.js';

const { maxStorageGb, maxStorageDecimals, maxApiCalls } = SIMULATION_LIMITS;

const INVALID_CUSTOMER = 'El cliente debe ser un identificador válido';

/** Entero positivo; si no existe en la BD, el servicio responde 404. */
const customerIdField = z
  .number({ error: (issue) => (issue.input === undefined ? 'El cliente es obligatorio' : INVALID_CUSTOMER) })
  .int({ error: INVALID_CUSTOMER })
  .positive({ error: INVALID_CUSTOMER });

export const newSimulationSchema = z.object(
  {
    customerId: customerIdField,
    activeUsers: activeUsersField,
    storageGb: requiredNumber('El almacenamiento', maxStorageGb).refine(
      (value) => hasAtMostDecimals(value, maxStorageDecimals),
      { error: `El almacenamiento admite como máximo ${maxStorageDecimals} decimales` },
    ),
    apiCalls: requiredInteger('El número de llamadas a la API', maxApiCalls),
  },
  { error: 'El cuerpo de la petición debe ser un objeto JSON' },
);
