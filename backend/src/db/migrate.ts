import type { Db } from './connection.js';
import { MIGRATIONS } from './migrations/index.js';

export interface Migration {
  /** Número de versión único y creciente. */
  version: number;
  name: string;
  /** SQL estático (sin datos de usuario), puede contener varias sentencias. */
  sql: string;
}

const CREATE_MIGRATIONS_TABLE = `
  CREATE TABLE IF NOT EXISTS schema_migrations (
    version    INTEGER PRIMARY KEY,
    name       TEXT NOT NULL,
    applied_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`;

function appliedVersions(db: Db): Set<number> {
  const rows = db.prepare('SELECT version FROM schema_migrations').all() as { version: number }[];
  return new Set(rows.map((row) => row.version));
}

/**
 * Aplica las migraciones pendientes en orden, cada una en su propia transacción.
 * Es idempotente: devuelve las versiones aplicadas en esta llamada (vacío si no había pendientes).
 */
export function runMigrations(db: Db, migrations: readonly Migration[] = MIGRATIONS): number[] {
  db.exec(CREATE_MIGRATIONS_TABLE);

  const done = appliedVersions(db);
  const pending = migrations
    .filter((migration) => !done.has(migration.version))
    .sort((a, b) => a.version - b.version);

  const record = db.prepare('INSERT INTO schema_migrations (version, name) VALUES (?, ?)');
  const apply = db.transaction((migration: Migration) => {
    db.exec(migration.sql);
    record.run(migration.version, migration.name);
  });

  for (const migration of pending) {
    apply(migration);
  }
  return pending.map((migration) => migration.version);
}
