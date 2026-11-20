import Database from 'better-sqlite3';

export class DuplicateTaxIdError extends Error {
  constructor(readonly taxId: string) {
    super(`Ya existe un cliente con el identificador fiscal ${taxId}`);
    this.name = 'DuplicateTaxIdError';
  }
}

export function isUniqueViolation(error: unknown): boolean {
  return error instanceof Database.SqliteError && error.code === 'SQLITE_CONSTRAINT_UNIQUE';
}
