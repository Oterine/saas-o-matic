/** Tramos de precio acumulativos. Importes en céntimos de EUR. */
export interface PriceTier {
  /** Último usuario (incluido) que entra en este tramo. */
  upTo: number;
  /** Precio por usuario dentro del tramo, en céntimos. */
  unitCents: number;
}

export const PRICE_TIERS: readonly PriceTier[] = [
  { upTo: 10, unitCents: 1000 }, // usuarios 1-10: 10 €
  { upTo: 50, unitCents: 800 }, // usuarios 11-50: 8 €
  { upTo: Infinity, unitCents: 500 }, // usuarios 51+: 5 €
];
