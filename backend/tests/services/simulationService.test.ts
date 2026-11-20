import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { openDatabase, type Db } from '../../src/db/connection.js';
import { runMigrations } from '../../src/db/migrate.js';
import { CustomerNotFoundError } from '../../src/services/errors.js';
import { createCustomerRepository, type CustomerRepository } from '../../src/repositories/customerRepository.js';
import { createSimulationRepository, type SimulationRepository } from '../../src/repositories/simulationRepository.js';
import { createSimulationService, type SimulationService } from '../../src/services/simulationService.js';

let db: Db;
let customers: CustomerRepository;
let simulations: SimulationRepository;
let service: SimulationService;

function createCustomer(country: string, taxId: string): number {
  return customers.create({ companyName: `Cliente ${country}`, taxId, contactEmail: 'a@b.es', country, plan: 'starter' }).id;
}

const usage = { activeUsers: 15, storageGb: 100, apiCalls: 50000 };

beforeEach(() => {
  db = openDatabase(':memory:');
  runMigrations(db);
  customers = createCustomerRepository(db);
  simulations = createSimulationRepository(db);
  service = createSimulationService({ customers, simulations });
});

afterEach(() => {
  db.close();
});

describe('simulationService.create', () => {
  it('calcula con la tasa del país del cliente y guarda el resultado (ejemplo de la spec)', () => {
    const customerId = createCustomer('ES', 'B12345674');
    const created = service.create({ customerId, ...usage });

    expect(created).toMatchObject({ customerId, ...usage, baseCents: 14000, taxRatePercent: 21, taxCents: 2940, totalCents: 16940 });
    expect(simulations.listByCustomer(customerId)).toEqual([created]);
  });

  it.each([
    ['PT', 'PT12345678', 23, 3220],
    ['US', 'US12345678', 0, 0],
  ])('usa la tasa de %s (%i %%)', (country, taxId, taxRatePercent, taxCents) => {
    const customerId = createCustomer(country, taxId);
    expect(service.create({ customerId, ...usage })).toMatchObject({ baseCents: 14000, taxRatePercent, taxCents });
  });

  it('listForCustomer devuelve el historial del cliente', () => {
    const customerId = createCustomer('ES', 'B12345674');
    const created = service.create({ customerId, ...usage });
    expect(service.listForCustomer(customerId)).toEqual([created]);
  });

  it('listForCustomer lanza CustomerNotFoundError si el cliente no existe', () => {
    expect(() => service.listForCustomer(999)).toThrow(CustomerNotFoundError);
  });

  it('lanza CustomerNotFoundError si el cliente no existe y no guarda nada', () => {
    expect(() => service.create({ customerId: 999, ...usage })).toThrow(CustomerNotFoundError);
    const { count } = db.prepare('SELECT COUNT(*) AS count FROM simulations').get() as { count: number };
    expect(count).toBe(0);
  });
});
