import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { buildApp } from './app.js';
import { loadEnv } from './config/env.js';
import { openDatabase } from './db/connection.js';
import { runMigrations } from './db/migrate.js';

/** backend/.env (este fichero vive en src/ o en dist/). Es opcional: sin él se usan los valores por defecto. */
const ENV_FILE = fileURLToPath(new URL('../.env', import.meta.url));

async function start(): Promise<void> {
  if (existsSync(ENV_FILE)) process.loadEnvFile(ENV_FILE);
  const env = loadEnv(process.env);

  const db = openDatabase(env.DB_PATH);
  runMigrations(db);

  const app = buildApp({ db, logger: true });
  app.addHook('onClose', () => db.close());

  for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.once(signal, () => void app.close());
  }

  await app.listen({ port: env.PORT, host: 'localhost' });
}

start().catch((error: unknown) => {
  // Fallo de arranque (entorno inválido, BD inaccesible...): todavía no hay logger de Fastify.
  console.error(error);
  process.exitCode = 1;
});
