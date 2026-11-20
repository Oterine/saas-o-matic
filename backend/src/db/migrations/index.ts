import type { Migration } from '../migrate.js';
import { initialMigration } from './001_initial.js';

/** Lista de migraciones. Las nuevas se añaden al final con la siguiente versión. */
export const MIGRATIONS: readonly Migration[] = [initialMigration];
