import { z } from 'zod';
import { SIMULATION_LIMITS } from '../../config/limits.js';
import { getTaxRatePercent } from '../../config/taxRates.js';

const formatNumber = (value: number) => value.toLocaleString('es-ES');

/** Mensaje de tipo incorrecto. Un array aparece al repetir un parámetro de query (`?country=ES&country=PT`). */
function typeMessage(label: string, input: unknown, expected: string): string {
  if (input === undefined) return `${label} es obligatorio`;
  return Array.isArray(input) ? `${label} debe ser un único valor` : `${label} debe ser ${expected}`;
}

/** Texto obligatorio, sin espacios a los lados, con mensajes en español. */
export function requiredText(label: string) {
  const required = `${label} es obligatorio`;
  return z
    .string({ error: (issue) => typeMessage(label, issue.input, 'texto') })
    .trim()
    .min(1, { error: required });
}

/** Número obligatorio entre 0 y `max`, con mensajes en español. */
export function requiredNumber(label: string, max: number) {
  return z
    .number({ error: (issue) => typeMessage(label, issue.input, 'un número') })
    .min(0, { error: `${label} no puede ser negativo` })
    .max(max, { error: `${label} no puede superar ${formatNumber(max)}` });
}

/** Entero obligatorio entre 0 y `max`. */
export function requiredInteger(label: string, max: number) {
  return requiredNumber(label, max).int({ error: `${label} debe ser un número entero` });
}

/**
 * Comprueba los decimales sobre el texto del número y no multiplicando,
 * porque en coma flotante 0.29 * 100 = 28.999999999999996.
 */
export function hasAtMostDecimals(value: number, decimals: number): boolean {
  return new RegExp(`^\\d+(\\.\\d{1,${decimals}})?$`).test(String(value));
}

/** ISO-2 en mayúsculas con tasa de impuesto configurada. */
export const supportedCountry = requiredText('El país')
  .toUpperCase()
  .refine((code) => getTaxRatePercent(code) !== undefined, { error: 'País no soportado' });

export const activeUsersField = requiredInteger('El número de usuarios', SIMULATION_LIMITS.maxActiveUsers);
