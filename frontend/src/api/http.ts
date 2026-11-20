import type { ApiErrorCode, FieldErrors } from './types';

/** El proxy de Vite quita este prefijo y reenvía al backend (ver vite.config.ts). */
const API_BASE = '/api';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: ApiErrorCode,
    message: string,
    readonly fields: FieldErrors = {},
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ErrorBody {
  error: { code: ApiErrorCode; message: string; fields?: FieldErrors };
}

function isErrorBody(value: unknown): value is ErrorBody {
  if (typeof value !== 'object' || value === null || !('error' in value)) return false;
  const { error } = value;
  return typeof error === 'object' && error !== null && 'code' in error && 'message' in error;
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

async function toApiError(response: Response): Promise<ApiError> {
  const body = await readJson(response);
  if (isErrorBody(body)) {
    const { code, message, fields } = body.error;
    return new ApiError(response.status, code, message, fields);
  }
  return new ApiError(response.status, 'UNEXPECTED_RESPONSE', 'El servidor respondió con un error inesperado');
}

export interface RequestOptions {
  method?: 'GET' | 'POST';
  body?: unknown;
  signal?: AbortSignal;
}

/** Cancelada por quien llama: vale tanto `abort()` sin motivo (AbortError) como `abort(motivo)`. */
function isAbort(error: unknown, signal: AbortSignal | undefined): boolean {
  return signal?.aborted === true || (error instanceof DOMException && error.name === 'AbortError');
}

/**
 * Único punto de acceso HTTP al backend. Devuelve el JSON tipado o lanza ApiError.
 * Una cancelación (AbortError) se propaga tal cual para que quien llama la ignore.
 */
export async function request<T>(path: string, { method = 'GET', body, signal }: RequestOptions = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      signal,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (error) {
    if (isAbort(error, signal)) throw error;
    throw new ApiError(0, 'NETWORK_ERROR', 'No se pudo conectar con el servidor');
  }

  if (!response.ok) throw await toApiError(response);
  try {
    return (await response.json()) as T;
  } catch (error) {
    if (isAbort(error, signal)) throw error;
    throw new ApiError(response.status, 'UNEXPECTED_RESPONSE', 'La respuesta del servidor no es válida');
  }
}
