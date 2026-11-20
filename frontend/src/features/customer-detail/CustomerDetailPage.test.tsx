import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getCustomer } from '../../api/customers';
import { ApiError } from '../../api/http';
import { listSimulations } from '../../api/simulations';
import type { Customer, Simulation } from '../../api/types';
import { renderApp } from '../../testUtils';

vi.mock('../../api/customers', () => ({ getCustomer: vi.fn(), listCustomers: vi.fn() }));
vi.mock('../../api/simulations', () => ({ listSimulations: vi.fn(), createSimulation: vi.fn() }));
const getCustomerMock = vi.mocked(getCustomer);
const listSimulationsMock = vi.mocked(listSimulations);

const customer: Customer = {
  id: 1,
  companyName: 'Acme S.L.',
  taxId: 'B12345674',
  contactEmail: 'ops@acme.es',
  country: 'ES',
  plan: 'business',
  createdAt: '2026-11-20T12:00:00Z',
};

const simulation = (id: number, activeUsers: number, baseCents: number): Simulation => ({
  id,
  customerId: 1,
  activeUsers,
  storageGb: 100,
  apiCalls: 50000,
  baseCents,
  taxRate: 0.21,
  taxCents: Math.round(baseCents * 0.21),
  totalCents: baseCents + Math.round(baseCents * 0.21),
  currency: 'EUR',
  createdAt: '2026-11-20T12:00:00Z',
});

const rates = { EUR: 1, USD: 1.1 };
const plain = (text: string | null) => (text ?? '').replace(/\s/g, ' ');

beforeEach(() => {
  getCustomerMock.mockReset().mockResolvedValue(customer);
  listSimulationsMock.mockReset().mockResolvedValue([simulation(2, 51, 42500), simulation(1, 15, 14000)]);
});

describe('CustomerDetailPage', () => {
  it('muestra los datos del cliente en su tarjeta', async () => {
    renderApp('/customers/1');

    expect(await screen.findByRole('heading', { level: 1, name: 'Acme S.L.' })).toBeInTheDocument();
    const info = screen.getByRole('region', { name: 'Datos del cliente' });
    expect(info).toHaveTextContent('B12345674');
    expect(info).toHaveTextContent('España');
    expect(info).toHaveTextContent('Business');
    expect(info).toHaveTextContent('20 de noviembre de 2026');
    expect(within(info).getByRole('link', { name: 'ops@acme.es' })).toHaveAttribute('href', 'mailto:ops@acme.es');
    expect(document.title).toBe('Acme S.L. · SaaS-O-Matic');
    expect(screen.getByRole('link', { name: 'Volver a clientes' })).toHaveAttribute('href', '/');
  });

  it('muestra el historial en el orden recibido, con importes en EUR', async () => {
    renderApp('/customers/1');

    const history = await screen.findByRole('region', { name: 'Historial de simulaciones' });
    const items = await within(history).findAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(plain(items[0]!.textContent)).toContain('51');
    expect(plain(items[0]!.textContent)).toContain('425,00 €');
    expect(plain(items[0]!.textContent)).toContain('514,25 €');
    expect(plain(items[0]!.textContent)).toContain('Impuesto (21 %)');
  });

  it('al cambiar la divisa convierte el historial sin recargar', async () => {
    const user = userEvent.setup();
    renderApp('/customers/1', vi.fn().mockResolvedValue(rates));

    const history = await screen.findByRole('region', { name: 'Historial de simulaciones' });
    await within(history).findAllByRole('listitem');
    const select = screen.getByLabelText('Divisa');
    await waitFor(() => expect(select).toBeEnabled());

    await user.selectOptions(select, 'USD');

    expect(plain(history.textContent)).toContain('154,00');
    expect(history).toHaveTextContent('Importes convertidos a USD con el tipo de cambio actual');
    expect(listSimulationsMock).toHaveBeenCalledOnce();
  });

  it('historial vacío', async () => {
    listSimulationsMock.mockResolvedValue([]);
    renderApp('/customers/1');

    expect(await screen.findByText('Todavía no hay simulaciones')).toBeInTheDocument();
  });

  it('404: muestra "Cliente no encontrado" con enlace al listado', async () => {
    getCustomerMock.mockRejectedValue(new ApiError(404, 'NOT_FOUND', 'Cliente no encontrado'));
    renderApp('/customers/999');

    expect(await screen.findByRole('heading', { level: 1, name: 'Cliente no encontrado' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Volver al listado de clientes' })).toHaveAttribute('href', '/');
    expect(document.title).toBe('Cliente no encontrado · SaaS-O-Matic');
  });

  it('un id no válido muestra "Cliente no encontrado" sin llamar a la API', () => {
    renderApp('/customers/abc');

    expect(screen.getByRole('heading', { level: 1, name: 'Cliente no encontrado' })).toBeInTheDocument();
    expect(getCustomerMock).not.toHaveBeenCalled();
  });

  it('si falla la carga del cliente permite reintentar', async () => {
    const user = userEvent.setup();
    getCustomerMock
      .mockReset()
      .mockRejectedValueOnce(new ApiError(0, 'NETWORK_ERROR', 'No se pudo conectar con el servidor'))
      .mockResolvedValueOnce(customer);
    renderApp('/customers/1');

    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo conectar con el servidor');
    await user.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Acme S.L.' })).toBeInTheDocument();
  });

  it('si falla el historial lo indica dentro de su sección, sin ocultar los datos del cliente', async () => {
    listSimulationsMock.mockRejectedValue(new ApiError(500, 'INTERNAL_ERROR', 'Error interno del servidor'));
    renderApp('/customers/1');

    const history = await screen.findByRole('region', { name: 'Historial de simulaciones' });
    expect(await within(history).findByRole('alert')).toHaveTextContent('Error interno del servidor');
    expect(screen.getByRole('region', { name: 'Datos del cliente' })).toBeInTheDocument();
  });
});
