import type { Migration } from '../migrate.js';

/** Esquema inicial (spec §5). La tasa se guarda como porcentaje entero para no almacenar floats junto a importes. */
export const initialMigration: Migration = {
  version: 1,
  name: 'initial',
  sql: `
    CREATE TABLE customers (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      company_name  TEXT NOT NULL,
      tax_id        TEXT NOT NULL UNIQUE,
      contact_email TEXT NOT NULL,
      country       TEXT NOT NULL,
      plan          TEXT NOT NULL CHECK (plan IN ('starter', 'business', 'enterprise')),
      created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE simulations (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id      INTEGER NOT NULL REFERENCES customers(id),
      active_users     INTEGER NOT NULL CHECK (active_users >= 0),
      storage_gb       REAL    NOT NULL CHECK (storage_gb >= 0),
      api_calls        INTEGER NOT NULL CHECK (api_calls >= 0),
      base_cents       INTEGER NOT NULL,
      tax_rate_percent INTEGER NOT NULL CHECK (tax_rate_percent >= 0),
      tax_cents        INTEGER NOT NULL,
      total_cents      INTEGER NOT NULL,
      created_at       TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX idx_simulations_customer ON simulations(customer_id);
    CREATE INDEX idx_customers_company ON customers(company_name);
  `,
};
