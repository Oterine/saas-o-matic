import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { listCountries } from './countries';
import { createCustomer, getCustomer, listCustomers } from './customers';
import { getPricingPreview } from './pricing';
import { createSimulation, listSimulations } from './simulations';

const fetchMock = vi.fn<typeof fetch>();

/** URL y método de la última llamada a fetch. */
function lastCall(): { url: string; method: string | undefined; body: unknown } {
  const [url, init] = fetchMock.mock.lastCall ?? [];
  return { url: String(url), method: init?.method, body: init?.body };
}

beforeEach(() => {
  fetchMock.mockImplementation(async () => new Response('[]', { status: 200 }));
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
});

describe('customers', () => {
  it('listCustomers sin texto no envía search', async () => {
    await listCustomers();
    expect(lastCall().url).toBe('/api/customers');
    await listCustomers('   ');
    expect(lastCall().url).toBe('/api/customers');
  });

  it('listCustomers codifica el texto de búsqueda', async () => {
    await listCustomers(' Álvarez & Cía ');
    expect(lastCall().url).toBe('/api/customers?search=%C3%81lvarez+%26+C%C3%ADa');
  });

  it('getCustomer y createCustomer', async () => {
    await getCustomer(7);
    expect(lastCall()).toMatchObject({ url: '/api/customers/7', method: 'GET' });

    const customer = { companyName: 'Acme', taxId: 'B12345674', contactEmail: 'a@b.es', country: 'ES', plan: 'business' as const };
    await createCustomer(customer);
    expect(lastCall()).toEqual({ url: '/api/customers', method: 'POST', body: JSON.stringify(customer) });
  });
});

describe('simulations', () => {
  it('createSimulation y listSimulations', async () => {
    const simulation = { customerId: 1, activeUsers: 15, storageGb: 100, apiCalls: 50000 };
    await createSimulation(simulation);
    expect(lastCall()).toEqual({ url: '/api/simulations', method: 'POST', body: JSON.stringify(simulation) });

    await listSimulations(1);
    expect(lastCall()).toMatchObject({ url: '/api/customers/1/simulations', method: 'GET' });
  });
});

describe('pricing y countries', () => {
  it('getPricingPreview envía users y country', async () => {
    await getPricingPreview(15, 'ES');
    expect(lastCall().url).toBe('/api/pricing/preview?users=15&country=ES');
  });

  it('listCountries', async () => {
    await listCountries();
    expect(lastCall().url).toBe('/api/countries');
  });
});
