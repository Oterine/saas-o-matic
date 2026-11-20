import { ApiError } from '../api/http';

/** Mensaje para mostrar: el de la API si viene de ella; si no, uno genérico (nunca detalles técnicos). */
export function errorMessage(error: unknown, fallback = 'Ha ocurrido un error inesperado'): string {
  return error instanceof ApiError ? error.message : fallback;
}
