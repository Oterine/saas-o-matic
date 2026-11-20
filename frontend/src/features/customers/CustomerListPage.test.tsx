import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { listCustomers } from '../../api/customers';
import { ApiError } from '../../api/http';
import type { Customer } from '../../api/types';
import { renderApp } from '../../testUtils';

vi.mock('../../api/customers', () => ({ listCustomers: vi.fn() }));
const listCustomersMock = vi.mocked(listCustomers);

const customer = (id: number, companyName: string, taxId: string): Customer => ({
  id,
  companyName,
  taxId,
  contactEmail: 'ops@example.es',
  country: 'ES',
  plan: 'business',
  createdAt: '2026-11-20T10:00:00Z',
});

const acme = customer(1, 'Acme S.L.', 'B12345674');
const beta = customer(2, 'Beta Cloud', 'A58818501');

beforeEach(() => {
  listCustomersMock.mockReset();
});

describe('CustomerListPage', () => {
  it('muestra los clientes en tarjetas con sus datos y enlace al detalle', async () => {
    listCustomersMock.mockResolvedValue([acme, beta]);
    renderApp('/');

    const list = await screen.findByRole('list');
    const cards = within(list).getAllByRole('listitem');
    expect(cards).toHaveLength(2);
    expect(within(cards[0]!).getByRole('link', { name: 'Acme S.L.' })).toHaveAttribute('href', '/customers/1');
    expect(cards[0]).toHaveTextContent('B12345674');
    expect(cards[0]).toHaveTextContent('España');
    expect(cards[0]).toHaveTextContent('Business');
    expect(screen.getByText('2 clientes')).toBeInTheDocument();
  });

  it('sin clientes muestra un estado vacío con enlace para crear el primero', async () => {
    listCustomersMock.mockResolvedValue([]);
    renderApp('/');

    expect(await screen.findByText('Todavía no hay clientes')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Registra el primero' })).toHaveAttribute('href', '/customers/new');
  });

  it('busca con debounce y muestra un vacío propio si no hay coincidencias', async () => {
    const user = userEvent.setup();
    listCustomersMock.mockResolvedValueOnce([acme, beta]).mockResolvedValue([]);
    renderApp('/');
    await screen.findByRole('list');

    await user.type(screen.getByLabelText('Buscar por empresa o identificador fiscal'), 'zzz');

    expect(await screen.findByText('No hay clientes que coincidan con «zzz»')).toBeInTheDocument();
    // Una sola petición para todo el texto, no una por pulsación.
    expect(listCustomersMock.mock.calls.map(([search]) => search)).toEqual(['', 'zzz']);
  });

  it('si falla muestra el error y permite reintentar', async () => {
    const user = userEvent.setup();
    listCustomersMock
      .mockRejectedValueOnce(new ApiError(0, 'NETWORK_ERROR', 'No se pudo conectar con el servidor'))
      .mockResolvedValueOnce([acme]);
    renderApp('/');

    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo conectar con el servidor');
    await user.click(screen.getByRole('button', { name: 'Reintentar' }));

    await waitFor(() => expect(screen.getByRole('link', { name: 'Acme S.L.' })).toBeInTheDocument());
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('muestra el estado de carga y el botón para crear cliente', () => {
    listCustomersMock.mockReturnValue(new Promise(() => {}));
    renderApp('/');

    expect(screen.getByText('Cargando clientes…')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Nuevo cliente' })).toHaveAttribute('href', '/customers/new');
  });
});
