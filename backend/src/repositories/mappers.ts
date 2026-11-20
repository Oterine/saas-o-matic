import type { Plan } from '../config/plans.js';
import type { Customer } from '../domain/customer.js';

export interface CustomerRow {
  id: number;
  company_name: string;
  tax_id: string;
  contact_email: string;
  country: string;
  plan: Plan;
  created_at: string;
}

/** Convierte una fecha de SQLite (`YYYY-MM-DD HH:MM:SS`, UTC) a ISO 8601 (`YYYY-MM-DDTHH:MM:SSZ`). */
export function toIsoUtc(sqliteDate: string): string {
  return `${sqliteDate.replace(' ', 'T')}Z`;
}

export function mapCustomerRow(row: CustomerRow): Customer {
  return {
    id: row.id,
    companyName: row.company_name,
    taxId: row.tax_id,
    contactEmail: row.contact_email,
    country: row.country,
    plan: row.plan,
    createdAt: toIsoUtc(row.created_at),
  };
}
