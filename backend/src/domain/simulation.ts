export interface NewSimulation {
  customerId: number;
  activeUsers: number;
  storageGb: number;
  apiCalls: number;
  baseCents: number;
  /** Tasa aplicada en el momento de la simulación, en porcentaje entero (21 = 21 %). */
  taxRatePercent: number;
  taxCents: number;
  totalCents: number;
}

export interface Simulation extends NewSimulation {
  id: number;
  /** ISO 8601 en UTC, por ejemplo 2026-11-20T10:00:00Z. */
  createdAt: string;
}
