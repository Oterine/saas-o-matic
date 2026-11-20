/** Divisas de visualización (decisión A12). Los importes llegan siempre en céntimos de EUR. */
export const SUPPORTED_CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF', 'JPY', 'MXN'] as const;

export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number];

export const BASE_CURRENCY: CurrencyCode = 'EUR';

/** Configuración regional para formatear importes y fechas. */
export const LOCALE = 'es-ES';

export const EXCHANGE_RATES_URL = 'https://open.er-api.com/v6/latest/EUR';

/** Los tipos de cambio se reutilizan durante 1 hora (spec §7). */
export const EXCHANGE_RATES_TTL_MS = 60 * 60 * 1000;
