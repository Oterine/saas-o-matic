import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { openDatabase, type Db } from '../../src/db/connection.js';
import { runMigrations } from '../../src/db/migrate.js';
import type { NewCustomer } from '../../src/domain/customer.js';
import { createCustomerRepository, type CustomerRepository } from '../../src/repositories/customerRepository.js';
import { DuplicateTaxIdError } from '../../src/repositories/errors.js';

let db: Db;
let repo: CustomerRepository;

const acme: NewCustomer = {
  companyName: 'Acme S.L.',
  taxId: 'B12345674',
  contactEmail: 'ops@acme.es',
  country: 'ES',
  plan: 'business',
};

const customer = (companyName: string, taxId: string): NewCustomer => ({ ...acme, companyName, taxId });
const names = (list: { companyName: string }[]) => list.map((c) => c.companyName);

beforeEach(() => {
  db = openDatabase(':memory:');
  runMigrations(db);
  repo = createCustomerRepository(db);
});

afterEach(() => {
  db.close();
});

describe('create', () => {
  it('devuelve el cliente creado con id y createdAt en ISO UTC', () => {
    const created = repo.create(acme);
    expect(created).toMatchObject({ id: 1, ...acme });
    expect(created.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });

  it('lanza DuplicateTaxIdError si el identificador ya existe', () => {
    repo.create(acme);
    expect(() => repo.create(customer('Otra S.A.', acme.taxId))).toThrow(DuplicateTaxIdError);
  });
});

describe('findById', () => {
  it('devuelve el cliente si existe', () => {
    const { id } = repo.create(acme);
    expect(repo.findById(id)).toMatchObject(acme);
  });

  it('devuelve undefined si no existe', () => {
    expect(repo.findById(999)).toBeUndefined();
  });
});

describe('search', () => {
  beforeEach(() => {
    repo.create(customer('zeta Logística', 'B12345674'));
    repo.create(customer('Acme S.L.', 'A58818501'));
    repo.create(customer('Beta 100% Cloud', 'X1234567L'));
    repo.create(customer('beta_labs', '12345678Z'));
  });

  it('sin texto lista todos en orden alfabético sin distinguir mayúsculas', () => {
    expect(names(repo.search())).toEqual(['Acme S.L.', 'Beta 100% Cloud', 'beta_labs', 'zeta Logística']);
    expect(names(repo.search('   '))).toHaveLength(4);
  });

  it('busca por nombre parcial sin distinguir mayúsculas', () => {
    expect(names(repo.search('ACME'))).toEqual(['Acme S.L.']);
    expect(names(repo.search('eta'))).toEqual(['Beta 100% Cloud', 'beta_labs', 'zeta Logística']);
  });

  it('busca por identificador fiscal normalizado', () => {
    expect(names(repo.search('a-588'))).toEqual(['Acme S.L.']);
    expect(names(repo.search('x 1234'))).toEqual(['Beta 100% Cloud']);
  });

  it('trata % y _ como caracteres literales', () => {
    expect(names(repo.search('100%'))).toEqual(['Beta 100% Cloud']);
    expect(names(repo.search('_'))).toEqual(['beta_labs']);
  });

  it('no devuelve todo si el texto normalizado queda vacío', () => {
    expect(repo.search(' - ')).toEqual([]);
  });

  it('devuelve una lista vacía si no hay coincidencias', () => {
    expect(repo.search('inexistente')).toEqual([]);
  });

  it('ignora tildes y mayúsculas fuera de ASCII', () => {
    repo.create(customer('ÑANDÚ S.L.', 'B87654321'));
    repo.create(customer('Álvarez y Asociados', 'Y1234567X'));

    expect(names(repo.search('ñandú'))).toEqual(['ÑANDÚ S.L.']);
    expect(names(repo.search('nandu'))).toEqual(['ÑANDÚ S.L.']);
    expect(names(repo.search('ALVAREZ'))).toEqual(['Álvarez y Asociados']);
  });

  it('ordena las letras con tilde junto a su letra base', () => {
    repo.create(customer('Álvarez y Asociados', 'Y1234567X'));
    expect(names(repo.search())).toEqual([
      'Acme S.L.',
      'Álvarez y Asociados',
      'Beta 100% Cloud',
      'beta_labs',
      'zeta Logística',
    ]);
  });

  it('respeta el límite de resultados', () => {
    const limited = createCustomerRepository(db, 2);
    expect(names(limited.search())).toEqual(['Acme S.L.', 'Beta 100% Cloud']);
    expect(limited.search('eta')).toHaveLength(2);
  });
});
