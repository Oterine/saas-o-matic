import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { openDatabase, type Db } from '../../src/db/connection.js';
import { runMigrations, type Migration } from '../../src/db/migrate.js';

let db: Db;

beforeEach(() => {
  db = openDatabase(':memory:');
});

afterEach(() => {
  db.close();
});

function schemaObjects(type: 'table' | 'index'): string[] {
  const rows = db
    .prepare("SELECT name FROM sqlite_master WHERE type = ? AND name NOT LIKE 'sqlite_%' ORDER BY name")
    .all(type) as { name: string }[];
  return rows.map((row) => row.name);
}

function insertCustomer(plan = 'business'): number {
  const result = db
    .prepare(
      `INSERT INTO customers (company_name, tax_id, contact_email, country, plan)
       VALUES ('Acme S.L.', 'B12345674', 'ops@acme.es', 'ES', ?)`,
    )
    .run(plan);
  return Number(result.lastInsertRowid);
}

const insertSimulation = (customerId: number) =>
  db
    .prepare(
      `INSERT INTO simulations
         (customer_id, active_users, storage_gb, api_calls, base_cents, tax_rate_percent, tax_cents, total_cents)
       VALUES (?, 15, 100, 50000, 14000, 21, 2940, 16940)`,
    )
    .run(customerId);

describe('runMigrations', () => {
  it('crea las tablas e índices de la spec', () => {
    expect(runMigrations(db)).toEqual([1]);
    expect(schemaObjects('table')).toEqual(['customers', 'schema_migrations', 'simulations']);
    expect(schemaObjects('index')).toEqual(['idx_customers_company', 'idx_simulations_customer']);
  });

  it('es idempotente', () => {
    runMigrations(db);
    expect(runMigrations(db)).toEqual([]);
    const { count } = db.prepare('SELECT COUNT(*) AS count FROM schema_migrations').get() as { count: number };
    expect(count).toBe(1);
  });

  it('aplica las pendientes en orden de versión', () => {
    const migrations: Migration[] = [
      { version: 2, name: 'second', sql: 'CREATE TABLE b (id INTEGER)' },
      { version: 1, name: 'first', sql: 'CREATE TABLE a (id INTEGER)' },
    ];
    expect(runMigrations(db, migrations)).toEqual([1, 2]);
  });

  it('revierte una migración que falla y no la registra', () => {
    const broken: Migration = {
      version: 1,
      name: 'broken',
      sql: 'CREATE TABLE half (id INTEGER); CREATE TABLE half (id INTEGER);',
    };
    expect(() => runMigrations(db, [broken])).toThrow();
    expect(schemaObjects('table')).toEqual(['schema_migrations']);
  });
});

describe('restricciones del esquema', () => {
  beforeEach(() => {
    runMigrations(db);
  });

  it('acepta una simulación de un cliente existente', () => {
    expect(() => insertSimulation(insertCustomer())).not.toThrow();
  });

  it('rechaza una simulación de un cliente inexistente (claves foráneas activas)', () => {
    expect(() => insertSimulation(999)).toThrow(/FOREIGN KEY/);
  });

  it('rechaza un plan no válido', () => {
    expect(() => insertCustomer('gold')).toThrow(/CHECK/);
  });

  it('rechaza un tax_id duplicado', () => {
    insertCustomer();
    expect(() => insertCustomer()).toThrow(/UNIQUE/);
  });

  it('rechaza valores negativos en la simulación', () => {
    const customerId = insertCustomer();
    expect(() =>
      db
        .prepare(
          `INSERT INTO simulations
             (customer_id, active_users, storage_gb, api_calls, base_cents, tax_rate_percent, tax_cents, total_cents)
           VALUES (?, -1, 0, 0, 0, 21, 0, 0)`,
        )
        .run(customerId),
    ).toThrow(/CHECK/);
  });
});
