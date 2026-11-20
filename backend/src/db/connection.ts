import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import { registerSqlFunctions } from './functions.js';

export type Db = Database.Database;

const IN_MEMORY = ':memory:';

/** Raíz de backend/: este fichero vive en src/db/ (o dist/db/ tras compilar). */
const BACKEND_ROOT = fileURLToPath(new URL('../../', import.meta.url));

/** Resuelve rutas relativas respecto a backend/, sin depender del directorio desde el que se lance el proceso. */
export function resolveDbPath(dbPath: string, baseDir: string = BACKEND_ROOT): string {
  return dbPath === IN_MEMORY ? IN_MEMORY : resolve(baseDir, dbPath);
}

export function openDatabase(dbPath: string): Db {
  const path = resolveDbPath(dbPath);
  if (path !== IN_MEMORY) {
    mkdirSync(dirname(path), { recursive: true });
  }

  const db = new Database(path);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  registerSqlFunctions(db);
  return db;
}
