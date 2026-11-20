import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { ValidationError } from '../../src/http/errors.js';
import { parseOrThrow } from '../../src/http/validate.js';

const schema = z.object({
  name: z.string().min(1),
  users: z.number().int().min(0),
  address: z.object({ country: z.string().length(2) }),
});

function captureError(data: unknown, target: z.ZodType = schema): ValidationError {
  try {
    parseOrThrow(target, data);
  } catch (error) {
    if (error instanceof ValidationError) return error;
    throw error;
  }
  throw new Error('Se esperaba un ValidationError');
}

describe('parseOrThrow', () => {
  it('devuelve los datos validados', () => {
    const data = { name: 'Acme', users: 15, address: { country: 'ES' } };
    expect(parseOrThrow(schema, data)).toEqual(data);
  });

  it('lanza ValidationError con un mensaje por campo, incluidos los anidados', () => {
    const error = captureError({ name: '', users: -1, address: { country: 'ESP' } });
    expect(error.statusCode).toBe(422);
    expect(Object.keys(error.fields ?? {}).sort()).toEqual(['address.country', 'name', 'users']);
  });

  it('usa la traducción al español de Zod como respaldo si el esquema no define el mensaje', () => {
    const error = captureError({ name: 'Acme', users: 1.5, address: { country: 'ES' } });
    expect(error.fields?.users).toMatch(/inválid/i);
  });

  it('respeta los mensajes propios del esquema', () => {
    const withMessage = z.object({ users: z.number().int({ error: 'Debe ser un número entero' }) });
    expect(captureError({ users: 1.5 }, withMessage).fields).toEqual({ users: 'Debe ser un número entero' });
  });

  it('asigna los errores de la raíz al campo "_"', () => {
    expect(captureError('no es un objeto').fields).toHaveProperty('_');
  });
});
