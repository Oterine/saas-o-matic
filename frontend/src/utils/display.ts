import type { Plan } from '../api/types';
import { LOCALE } from '../config/currencies';

const regionNames = new Intl.DisplayNames(LOCALE, { type: 'region' });

/** "ES" → "España". El backend solo devuelve el código ISO-2. */
export function countryName(code: string): string {
  try {
    return regionNames.of(code) ?? code;
  } catch {
    return code;
  }
}

const PLAN_LABELS: Record<Plan, string> = {
  starter: 'Starter',
  business: 'Business',
  enterprise: 'Enterprise',
};

export const planLabel = (plan: Plan): string => PLAN_LABELS[plan];
