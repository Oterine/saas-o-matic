import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, request } from './http';

const fetchMock = vi.fn<typeof fetch>();

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

async function captureApiError(promise: Promise<unknown>): Promise<ApiError> {
  const error = await promise.catch((e: unknown) => e);
  expect(error).toBeInstanceOf(ApiError);
  return error as ApiError;
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
});

describe('request', () => {
  it('devuelve el JSON de una respuesta correcta y usa el prefijo /api', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, [{ code: 'ES', taxRate: 0.21 }]));

    await expect(request('/countries')).resolves.toEqual([{ code: 'ES', taxRate: 0.21 }]);
    expect(fetchMock).toHaveBeenCalledWith('/api/countries', expect.objectContaining({ method: 'GET' }));
  });

  it('envía el cuerpo como JSON en un POST', async () => {
    fetchMock.mockResolvedValue(jsonResponse(201, { id: 1 }));

    await request('/customers', { method: 'POST', body: { companyName: 'Acme' } });
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/customers',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{"companyName":"Acme"}',
      }),
    );
  });

  it('convierte un 422 en ApiError con los campos', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(422, {
        error: { code: 'VALIDATION_ERROR', message: 'Los datos enviados no son válidos', fields: { taxId: 'Letra incorrecta' } },
      }),
    );

    const error = await captureApiError(request('/customers', { method: 'POST', body: {} }));
    expect(error).toMatchObject({
      status: 422,
      code: 'VALIDATION_ERROR',
      message: 'Los datos enviados no son válidos',
      fields: { taxId: 'Letra incorrecta' },
    });
  });

  it('convierte un 404 en ApiError sin campos', async () => {
    fetchMock.mockResolvedValue(jsonResponse(404, { error: { code: 'NOT_FOUND', message: 'Cliente no encontrado' } }));

    const error = await captureApiError(request('/customers/9'));
    expect(error).toMatchObject({ status: 404, code: 'NOT_FOUND', message: 'Cliente no encontrado', fields: {} });
  });

  it('un error sin el formato de la API (p. ej. 502 del proxy) es UNEXPECTED_RESPONSE', async () => {
    fetchMock.mockResolvedValue(new Response('Bad Gateway', { status: 502 }));

    const error = await captureApiError(request('/countries'));
    expect(error).toMatchObject({ status: 502, code: 'UNEXPECTED_RESPONSE' });
  });

  it('una respuesta 200 que no es JSON es UNEXPECTED_RESPONSE', async () => {
    fetchMock.mockResolvedValue(new Response('<!doctype html>', { status: 200 }));

    const error = await captureApiError(request('/countries'));
    expect(error).toMatchObject({ status: 200, code: 'UNEXPECTED_RESPONSE' });
  });

  it('un fallo de red es NETWORK_ERROR con mensaje en español', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    const error = await captureApiError(request('/countries'));
    expect(error).toMatchObject({ status: 0, code: 'NETWORK_ERROR', message: 'No se pudo conectar con el servidor' });
  });

  it('propaga la cancelación tal cual, sin convertirla en ApiError', async () => {
    fetchMock.mockRejectedValue(new DOMException('The operation was aborted.', 'AbortError'));

    await expect(request('/countries', { signal: new AbortController().signal })).rejects.toMatchObject({
      name: 'AbortError',
    });
  });

  it('propaga también una cancelación con motivo propio', async () => {
    const controller = new AbortController();
    const reason = new Error('búsqueda sustituida');
    controller.abort(reason);
    fetchMock.mockRejectedValue(reason);

    await expect(request('/countries', { signal: controller.signal })).rejects.toBe(reason);
  });
});
