import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/app.js';
import { openDatabase, type Db } from '../../src/db/connection.js';
import { runMigrations } from '../../src/db/migrate.js';

export interface TestApp {
  app: FastifyInstance;
  db: Db;
  close: () => Promise<void>;
}

/** App completa sobre una BD en memoria ya migrada. */
export function createTestApp(): TestApp {
  const db = openDatabase(':memory:');
  runMigrations(db);
  const app = buildApp({ db });
  return {
    app,
    db,
    close: async () => {
      await app.close();
      db.close();
    },
  };
}
