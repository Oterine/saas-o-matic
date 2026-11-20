import { z } from 'zod';
import { ValidationError, type FieldErrors } from './errors.js';

// Los mensajes de validación llegan a la interfaz, que está en español.
z.config(z.locales.es());

/** Agrupa los errores de Zod por campo (ruta con puntos); se queda con el primer mensaje de cada uno. */
function toFieldErrors(error: z.ZodError): FieldErrors {
  const fields: FieldErrors = {};
  for (const issue of error.issues) {
    const field = issue.path.map(String).join('.') || '_';
    fields[field] ??= issue.message;
  }
  return fields;
}

/** Valida `data` con el esquema y devuelve el valor tipado, o lanza ValidationError (422) con los campos. */
export function parseOrThrow<Schema extends z.ZodType>(schema: Schema, data: unknown): z.output<Schema> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ValidationError('Los datos enviados no son válidos', toFieldErrors(result.error));
  }
  return result.data;
}
