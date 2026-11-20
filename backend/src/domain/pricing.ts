import { PRICE_TIERS, type PriceTier } from '../config/pricing.js';

export interface Quote {
  baseCents: number;
  taxCents: number;
  totalCents: number;
}

/** Coste base (sin impuestos) en céntimos, por tramos acumulativos. */
export function calculateBaseCents(
  activeUsers: number,
  tiers: readonly PriceTier[] = PRICE_TIERS,
): number {
  if (!Number.isInteger(activeUsers) || activeUsers < 0) {
    throw new RangeError('activeUsers debe ser un entero mayor o igual que 0');
  }

  let total = 0;
  let previousLimit = 0;

  for (const tier of tiers) {
    const usersInTier = Math.min(activeUsers, tier.upTo) - previousLimit;
    if (usersInTier <= 0) break;
    total += usersInTier * tier.unitCents;
    previousLimit = tier.upTo;
  }

  return total;
}

/** Impuesto en céntimos con redondeo half-up. La tasa es un porcentaje entero (21 = 21 %). */
export function calculateTaxCents(baseCents: number, taxRatePercent: number): number {
  if (taxRatePercent < 0) {
    throw new RangeError('taxRatePercent no puede ser negativo');
  }
  return Math.round((baseCents * taxRatePercent) / 100);
}

export function calculateQuote(activeUsers: number, taxRatePercent: number): Quote {
  const baseCents = calculateBaseCents(activeUsers);
  const taxCents = calculateTaxCents(baseCents, taxRatePercent);
  return { baseCents, taxCents, totalCents: baseCents + taxCents };
}
