import { z } from 'zod';

const INVALID_ID = 'El identificador del cliente no es válido';

/** `:id` llega como texto: solo se aceptan enteros positivos escritos con dígitos (sin signo, decimales ni exponentes). */
export const customerIdParamsSchema = z.object({
  id: z
    .string({ error: INVALID_ID })
    .regex(/^[1-9]\d*$/, { error: INVALID_ID })
    .transform(Number)
    .refine(Number.isSafeInteger, { error: INVALID_ID }),
});
