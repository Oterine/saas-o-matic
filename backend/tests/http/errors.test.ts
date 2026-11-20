import type { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildApp } from '../../src/app.js';
import { openDatabase, type Db } from '../../src/db/connection.js';
import { NotFoundError, ValidationError } from '../../src/http/errors.js';
import { DuplicateTaxIdError } from '../../src/repositories/errors.js';

let db: Db;
let app: FastifyInstance;

/** Registra una ruta de prueba que lanza el error indicado. */
function throwing(path: string, error: unknown): void {
  app.get(path, () => {
    throw error;
  });
}

beforeEach(() => {
  db = openDatabase(':memory:');
  app = buildApp({ db });
  throwing('/validation', new ValidationError('Los datos enviados no son válidos', { taxId: 'Letra incorrecta' }));
  throwing('/not-found', new NotFoundError('Cliente no encontrado'));
  throwing('/duplicate', new DuplicateTaxIdError('B12345674'));
  throwing('/boom', new Error('detalle interno: SELECT * FROM secretos'));
  app.post('/echo', (request) => request.body);
});

afterEach(async () => {
  await app.close();
  db.close();
});

describe('formato de errores común', () => {
  it('ValidationError → 422 con fields', async () => {
    const res = await app.inject({ method: 'GET', url: '/validation' });
    expect(res.statusCode).toBe(422);
    expect(res.json()).toEqual({
      error: { code: 'VALIDATION_ERROR', message: 'Los datos enviados no son válidos', fields: { taxId: 'Letra incorrecta' } },
    });
  });

  it('NotFoundError → 404 sin fields', async () => {
    const res = await app.inject({ method: 'GET', url: '/not-found' });
    expect(res.statusCode).toBe(404);
    expect(res.json()).toEqual({ error: { code: 'NOT_FOUND', message: 'Cliente no encontrado' } });
  });

  it('DuplicateTaxIdError del repositorio → 409 DUPLICATE_TAX_ID con el campo taxId', async () => {
    const res = await app.inject({ method: 'GET', url: '/duplicate' });
    expect(res.statusCode).toBe(409);
    expect(res.json()).toMatchObject({ error: { code: 'DUPLICATE_TAX_ID', fields: { taxId: expect.any(String) } } });
  });

  it('error inesperado → 500 genérico sin filtrar el detalle', async () => {
    const res = await app.inject({ method: 'GET', url: '/boom' });
    expect(res.statusCode).toBe(500);
    expect(res.json()).toEqual({ error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' } });
    expect(res.body).not.toContain('secretos');
  });

  it('JSON mal formado → 422 VALIDATION_ERROR', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/echo',
      headers: { 'content-type': 'application/json' },
      payload: '{"companyName": ',
    });
    expect(res.statusCode).toBe(422);
    expect(res.json()).toMatchObject({ error: { code: 'VALIDATION_ERROR' } });
  });

  it('JSON vacío → 422 con el mensaje de JSON no válido', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/echo',
      headers: { 'content-type': 'application/json' },
      payload: '',
    });
    expect(res.statusCode).toBe(422);
    expect(res.json()).toEqual({
      error: { code: 'VALIDATION_ERROR', message: 'El cuerpo de la petición no es un JSON válido' },
    });
  });

  it('sin content-type → 422 pidiendo JSON', async () => {
    const res = await app.inject({ method: 'POST', url: '/echo', payload: 'hola' });
    expect(res.statusCode).toBe(422);
    expect(res.json()).toMatchObject({ error: { code: 'VALIDATION_ERROR', message: expect.stringMatching(/content-type/) } });
  });

  it('cuerpo demasiado grande → 422 explicando el tamaño', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/echo',
      headers: { 'content-type': 'application/json' },
      payload: JSON.stringify({ text: 'a'.repeat(1_100_000) }),
    });
    expect(res.statusCode).toBe(422);
    expect(res.json()).toMatchObject({ error: { message: 'El cuerpo de la petición es demasiado grande' } });
  });

  it('ruta inexistente → 404 NOT_FOUND', async () => {
    const res = await app.inject({ method: 'GET', url: '/no-existe' });
    expect(res.statusCode).toBe(404);
    expect(res.json()).toEqual({ error: { code: 'NOT_FOUND', message: 'Ruta no encontrada: GET /no-existe' } });
  });
});
