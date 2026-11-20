/** Rango del deslizador de usuarios (spec §7). */
export const SLIDER_MAX_USERS = 200;

/** Máximo del campo numérico: coincide con el límite del backend (spec §3.4, decisión C3). */
export const MAX_USERS = 100_000;

/** Espera tras el último cambio antes de pedir la vista previa al backend. */
export const PREVIEW_DEBOUNCE_MS = 250;

export const DEFAULT_SIMULATION = { activeUsers: '10', storageGb: '0', apiCalls: '0' } as const;
