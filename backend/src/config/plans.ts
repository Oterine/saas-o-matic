/** Planes comerciales. Son una etiqueta del cliente y no cambian el precio (spec §3.3). */
export const PLANS = ['starter', 'business', 'enterprise'] as const;

export type Plan = (typeof PLANS)[number];
