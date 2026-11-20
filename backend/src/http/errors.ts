import { DuplicateTaxIdError } from '../repositories/errors.js';

export type ErrorCode = 'VALIDATION_ERROR' | 'NOT_FOUND' | 'DUPLICATE_TAX_ID' | 'INTERNAL_ERROR';
export type FieldErrors = Record<string, string>;

export interface ErrorBody {
  error: { code: ErrorCode; message: string; fields?: FieldErrors };
}

export interface ErrorResponse {
  statusCode: number;
  body: ErrorBody;
}

export class HttpError extends Error {
  constructor(
    readonly statusCode: number,
    readonly code: ErrorCode,
    message: string,
    readonly fields?: FieldErrors,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class ValidationError extends HttpError {
  constructor(message: string, fields?: FieldErrors) {
    super(422, 'VALIDATION_ERROR', message, fields);
  }
}

export class NotFoundError extends HttpError {
  constructor(message: string) {
    super(404, 'NOT_FOUND', message);
  }
}

function response(statusCode: number, code: ErrorCode, message: string, fields?: FieldErrors): ErrorResponse {
  return { statusCode, body: { error: fields ? { code, message, fields } : { code, message } } };
}

/** Mensajes para los errores de cliente que genera Fastify antes de llegar a la ruta, según su código HTTP. */
const FRAMEWORK_CLIENT_MESSAGES: Readonly<Record<number, string>> = {
  413: 'El cuerpo de la petición es demasiado grande',
  415: 'El cuerpo debe enviarse como JSON (content-type: application/json)',
};
const DEFAULT_CLIENT_MESSAGE = 'El cuerpo de la petición no es un JSON válido';

/** Código 4xx de un error de Fastify (JSON mal formado, cuerpo vacío o enorme...), o undefined si no lo es. */
function frameworkClientStatus(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null || !('statusCode' in error)) return undefined;
  const { statusCode } = error;
  return typeof statusCode === 'number' && statusCode >= 400 && statusCode < 500 ? statusCode : undefined;
}

/** Traduce cualquier error al formato común de la API (spec §6). Nunca expone detalles internos. */
export function toErrorResponse(error: unknown): ErrorResponse {
  if (error instanceof HttpError) {
    return response(error.statusCode, error.code, error.message, error.fields);
  }
  if (error instanceof DuplicateTaxIdError) {
    return response(409, 'DUPLICATE_TAX_ID', error.message, {
      taxId: 'Ya existe un cliente con este identificador fiscal',
    });
  }
  const clientStatus = frameworkClientStatus(error);
  if (clientStatus !== undefined) {
    // Decisión C6: toda entrada inválida responde 422, con un mensaje que explica la causa real.
    return response(422, 'VALIDATION_ERROR', FRAMEWORK_CLIENT_MESSAGES[clientStatus] ?? DEFAULT_CLIENT_MESSAGE);
  }
  return response(500, 'INTERNAL_ERROR', 'Error interno del servidor');
}
