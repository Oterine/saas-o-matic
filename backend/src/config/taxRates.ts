/**
 * Tasa de IVA/impuesto por país (ISO-2), en porcentaje entero.
 * Se usan enteros para evitar errores de coma flotante al calcular.
 * Decisión de diseño: el enunciado no define las tasas (ver spec, sección 3.2).
 */
export const TAX_RATE_PERCENT_BY_COUNTRY: Readonly<Record<string, number>> = {
  ES: 21,
  PT: 23,
  FR: 20,
  DE: 19,
  IT: 22,
  GB: 20,
  US: 0,
};

export function getTaxRatePercent(country: string): number | undefined {
  return TAX_RATE_PERCENT_BY_COUNTRY[country.toUpperCase()];
}
