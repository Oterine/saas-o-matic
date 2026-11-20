import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { openDatabase, resolveDbPath, type Db } from '../../src/db/connection.js';

describe('resolveDbPath', () => {
  const base = resolve('/proyecto/backend');

  it('resuelve las rutas relativas respecto a la carpeta base', () => {
    expect(resolveDbPath('./data/app.db', base)).toBe(join(base, 'data', 'app.db'));
  });

  it('respeta las rutas absolutas', () => {
    const absolute = resolve('/otra/ruta/app.db');
    expect(resolveDbPath(absolute, base)).toBe(absolute);
  });

  it('deja :memory: tal cual', () => {
    expect(resolveDbPath(':memory:', base)).toBe(':memory:');
  });
});

describe('openDatabase', () => {
  let db: Db | undefined;
  let tempDir: string | undefined;

  afterEach(() => {
    db?.close();
    if (tempDir) rmSync(tempDir, { recursive: true, force: true });
    db = undefined;
    tempDir = undefined;
  });

  it('activa las claves foráneas', () => {
    db = openDatabase(':memory:');
    expect(db.pragma('foreign_keys', { simple: true })).toBe(1);
  });

  it('crea la carpeta del fichero si no existe y usa WAL', () => {
    tempDir = mkdtempSync(join(tmpdir(), 'saas-o-matic-'));
    const dbPath = join(tempDir, 'nested', 'test.db');

    db = openDatabase(dbPath);

    expect(existsSync(dbPath)).toBe(true);
    expect(db.pragma('journal_mode', { simple: true })).toBe('wal');
  });
});
