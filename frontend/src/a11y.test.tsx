import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { listCountries } from './api/countries';
import { createCustomer, getCustomer, listCustomers } from './api/customers';
import { ApiError } from './api/http';
import { getPricingPreview } from './api/pricing';
import { listSimulations } from './api/simulations';
import type { Customer } from './api/types';
import { renderApp } from './testUtils';

vi.mock('./api/countries', () => ({ listCountries: vi.fn() }));
vi.mock('./api/customers', () => ({ listCustomers: vi.fn(), getCustomer: vi.fn(), createCustomer: vi.fn() }));
vi.mock('./api/pricing', () => ({ getPricingPreview: vi.fn() }));
vi.mock('./api/simulations', () => ({ listSimulations: vi.fn(), createSimulation: vi.fn() }));

const customer: Customer = {
  id: 1,
  companyName: 'Acme S.L.',
  taxId: 'B12345674',
  contactEmail: 'ops@acme.es',
  country: 'ES',
  plan: 'business',
  createdAt: '2026-11-20T12:00:00Z',
};

const rates = async () => ({ EUR: 1, USD: 1.1, GBP: 0.85 });

/**
 * Reglas WCAG 2.0/2.1/2.2 A y AA. `color-contrast` se desactiva porque jsdom no calcula estilos ni
 * layout; el contraste de la paleta se calculó aparte con la fórmula WCAG (ver notas de F9).
 */
async function axeViolations(): Promise<string[]> {
  const results = await axe.run(document.body, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] },
    rules: { 'color-contrast': { enabled: false } },
  });
  return results.violations.map((v) => `${v.id}: ${v.help} → ${v.nodes.map((n) => n.html).join(' | ')}`);
}

async function expectNoViolations() {
  expect(await axeViolations()).toEqual([]);
}

beforeEach(() => {
  vi.mocked(listCustomers).mockResolvedValue([customer, { ...customer, id: 2, companyName: 'Beta', taxId: 'A58818501' }]);
  vi.mocked(getCustomer).mockResolvedValue(customer);
  vi.mocked(listCountries).mockResolvedValue([{ code: 'ES', taxRate: 0.21 }, { code: 'FR', taxRate: 0.2 }]);
  vi.mocked(getPricingPreview).mockResolvedValue({
    activeUsers: 10, baseCents: 10000, taxRate: 0.21, taxCents: 2100, totalCents: 12100, currency: 'EUR',
  });
  vi.mocked(listSimulations).mockResolvedValue([
    { id: 1, customerId: 1, activeUsers: 15, storageGb: 100, apiCalls: 50000, baseCents: 14000, taxRate: 0.21,
      taxCents: 2940, totalCents: 16940, currency: 'EUR', createdAt: '2026-11-20T12:00:00Z' },
  ]);
});

describe('accesibilidad (axe, WCAG A/AA)', () => {
  it('listado de clientes', async () => {
    renderApp('/', rates);
    await screen.findByRole('link', { name: 'Acme S.L.' });
    await expectNoViolations();
  });

  it('listado con error de carga', async () => {
    vi.mocked(listCustomers).mockRejectedValue(new ApiError(0, 'NETWORK_ERROR', 'No se pudo conectar con el servidor'));
    renderApp('/', rates);
    await screen.findByRole('button', { name: 'Reintentar' });
    await expectNoViolations();
  });

  it('alta de cliente, también con errores de validación visibles', async () => {
    vi.mocked(createCustomer).mockRejectedValue(
      new ApiError(422, 'VALIDATION_ERROR', 'Los datos enviados no son válidos', {
        companyName: 'El nombre de la empresa es obligatorio',
        taxId: 'La letra de control del DNI no es correcta',
        plan: 'El plan es obligatorio',
      }),
    );
    renderApp('/customers/new', rates);
    await waitFor(() => expect(screen.getByLabelText('País')).toHaveValue('ES'));
    await expectNoViolations();

    await userEvent.setup().click(screen.getByRole('button', { name: 'Registrar cliente' }));
    await screen.findByText('La letra de control del DNI no es correcta');
    await expectNoViolations();
  });

  it('detalle con simulador e historial', async () => {
    renderApp('/customers/1', rates);
    await screen.findByText('Total mensual');
    await screen.findByRole('region', { name: 'Historial de simulaciones' });
    await expectNoViolations();
  });

  it('página no encontrada', async () => {
    renderApp('/no-existe', rates);
    await expectNoViolations();
  });

  it('control negativo: detecta un campo sin etiqueta (la comprobación no es vacía)', async () => {
    const field = document.createElement('input');
    document.body.append(field);
    try {
      expect(await axeViolations()).toEqual([expect.stringMatching(/^label:/)]);
    } finally {
      field.remove();
    }
  });
});
