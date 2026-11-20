import { z } from 'zod';
import { activeUsersField, supportedCountry } from './fields.js';

const USERS_LABEL = 'El número de usuarios';

/** `?users=N&country=XX`. En la query todo llega como texto: solo dígitos, y después las reglas de activeUsers. */
export const pricingPreviewQuerySchema = z.object({
  users: z
    .string({
      error: (issue) =>
        issue.input === undefined ? `${USERS_LABEL} es obligatorio` : `${USERS_LABEL} debe ser un único valor`,
    })
    .regex(/^\d+$/, { error: `${USERS_LABEL} debe ser un número entero mayor o igual que 0` })
    .transform(Number)
    .pipe(activeUsersField),
  country: supportedCountry,
});
