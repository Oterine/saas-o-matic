/** Límites de los datos de una simulación (spec §3.4). */
export const SIMULATION_LIMITS = {
  maxActiveUsers: 100_000,
  maxStorageGb: 1_000_000,
  maxStorageDecimals: 2,
  maxApiCalls: 1_000_000_000,
} as const;
