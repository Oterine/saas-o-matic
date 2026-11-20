import type { Plan } from '../config/plans.js';
import type { Customer } from '../domain/customer.js';
import type { Simulation } from '../domain/simulation.js';

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

export interface SimulationRow {
  id: number;
  customer_id: number;
  active_users: number;
  storage_gb: number;
  api_calls: number;
  base_cents: number;
  tax_rate_percent: number;
  tax_cents: number;
  total_cents: number;
  created_at: string;
}

export function mapSimulationRow(row: SimulationRow): Simulation {
  return {
    id: row.id,
    customerId: row.customer_id,
    activeUsers: row.active_users,
    storageGb: row.storage_gb,
    apiCalls: row.api_calls,
    baseCents: row.base_cents,
    taxRatePercent: row.tax_rate_percent,
    taxCents: row.tax_cents,
    totalCents: row.total_cents,
    createdAt: toIsoUtc(row.created_at),
  };
}
