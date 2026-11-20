import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { openDatabase, type Db } from '../../src/db/connection.js';
import { runMigrations } from '../../src/db/migrate.js';
import type { NewSimulation } from '../../src/domain/simulation.js';
import { createCustomerRepository } from '../../src/repositories/customerRepository.js';
import {
  createSimulationRepository,
  type SimulationRepository,
} from '../../src/repositories/simulationRepository.js';

let db: Db;
let repo: SimulationRepository;
let customerId: number;

const simulation = (overrides: Partial<NewSimulation> = {}): NewSimulation => ({
  customerId,
  activeUsers: 15,
  storageGb: 100.5,
  apiCalls: 50000,
  baseCents: 14000,
  taxRatePercent: 21,
  taxCents: 2940,
  totalCents: 16940,
  ...overrides,
});

/** Fija created_at a mano para probar el orden sin depender del reloj. */
function setCreatedAt(id: number, createdAt: string): void {
  db.prepare('UPDATE simulations SET created_at = ? WHERE id = ?').run(createdAt, id);
}

beforeEach(() => {
  db = openDatabase(':memory:');
  runMigrations(db);
  repo = createSimulationRepository(db);
  customerId = createCustomerRepository(db).create({
    companyName: 'Acme S.L.',
    taxId: 'B12345674',
    contactEmail: 'ops@acme.es',
    country: 'ES',
    plan: 'business',
  }).id;
});

afterEach(() => {
  db.close();
});

describe('create', () => {
  it('guarda los datos recibidos y devuelve la simulación con id y createdAt en ISO UTC', () => {
    const created = repo.create(simulation());
    expect(created).toMatchObject({ id: 1, ...simulation() });
    expect(created.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });

  it('rechaza un cliente inexistente (clave foránea)', () => {
    expect(() => repo.create(simulation({ customerId: 999 }))).toThrow(/FOREIGN KEY/);
  });
});

describe('listByCustomer', () => {
  it('devuelve una lista vacía si el cliente no tiene simulaciones', () => {
    expect(repo.listByCustomer(customerId)).toEqual([]);
  });

  it('ordena por fecha descendente aunque el id diga lo contrario', () => {
    const newer = repo.create(simulation({ activeUsers: 1 }));
    const older = repo.create(simulation({ activeUsers: 2 }));
    setCreatedAt(newer.id, '2026-11-20 12:00:00');
    setCreatedAt(older.id, '2026-11-19 12:00:00');

    expect(repo.listByCustomer(customerId).map((s) => s.id)).toEqual([newer.id, older.id]);
  });

  it('desempata por id descendente si la fecha coincide', () => {
    const first = repo.create(simulation());
    const second = repo.create(simulation());
    setCreatedAt(first.id, '2026-11-20 12:00:00');
    setCreatedAt(second.id, '2026-11-20 12:00:00');

    expect(repo.listByCustomer(customerId).map((s) => s.id)).toEqual([second.id, first.id]);
  });

  it('no mezcla simulaciones de otros clientes', () => {
    const otherId = createCustomerRepository(db).create({
      companyName: 'Otra S.A.',
      taxId: 'A58818501',
      contactEmail: 'info@otra.es',
      country: 'ES',
      plan: 'starter',
    }).id;
    repo.create(simulation());
    repo.create(simulation({ customerId: otherId }));

    const history = repo.listByCustomer(customerId);
    expect(history).toHaveLength(1);
    expect(history[0]?.customerId).toBe(customerId);
  });
});
