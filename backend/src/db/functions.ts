import type Database from 'better-sqlite3';

const COMBINING_MARKS = /[̀-ͯ]/g;

/**
 * Pliega un texto para buscar y ordenar: minúsculas y sin tildes ni diéresis (`ÑANDÚ` → `nandu`).
 * Hace falta porque LIKE y COLLATE NOCASE de SQLite solo ignoran mayúsculas en ASCII.
 */
export function foldText(text: string): string {
  return text.normalize('NFD').replace(COMBINING_MARKS, '').toLowerCase();
}

/** Registra las funciones SQL propias en una conexión. */
export function registerSqlFunctions(db: Database.Database): void {
  db.function('fold', { deterministic: true }, (value: unknown) =>
    typeof value === 'string' ? foldText(value) : value,
  );
}
