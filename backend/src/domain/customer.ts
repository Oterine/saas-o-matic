import type { Plan } from '../config/plans.js';

export interface NewCustomer {
  companyName: string;
  /** Normalizado con normalizeTaxId antes de guardarse. */
  taxId: string;
  contactEmail: string;
  /** ISO-2 en mayúsculas. */
  country: string;
  plan: Plan;
}

export interface Customer extends NewCustomer {
  id: number;
  /** ISO 8601 en UTC, por ejemplo 2026-11-20T10:00:00Z. */
  createdAt: string;
}
