import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { listCountries } from '../../api/countries';
import { createCustomer, getCustomer } from '../../api/customers';
import { ApiError } from '../../api/http';
import type { Customer } from '../../api/types';
import { renderApp } from '../../testUtils';

vi.mock('../../api/countries', () => ({ listCountries: vi.fn() }));
vi.mock('../../api/customers', () => ({ createCustomer: vi.fn(), getCustomer: vi.fn(), listCustomers: vi.fn() }));
vi.mock('../../api/simulations', () => ({ listSimulations: vi.fn(async () => []), createSimulation: vi.fn() }));
const listCountriesMock = vi.mocked(listCountries);
const createCustomerMock = vi.mocked(createCustomer);
const getCustomerMock = vi.mocked(getCustomer);

const countries = [
  { code: 'DE', taxRate: 0.19 },
  { code: 'ES', taxRate: 0.21 },
  { code: 'FR', taxRate: 0.2 },
];

const created: Customer = {
  id: 42,
  companyName: 'Acme S.L.',
  taxId: 'B12345674',
  contactEmail: 'ops@acme.es',
  country: 'ES',
  plan: 'business',
  createdAt: '2026-11-20T10:00:00Z',
};

const validationError = (fields: Record<string, string>) =>
  new ApiError(422, 'VALIDATION_ERROR', 'Los datos enviados no son válidos', fields);

async function fillForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Nombre de la empresa'), 'Acme S.L.');
  await user.type(screen.getByLabelText('Identificador fiscal'), 'B12345674');
  await user.type(screen.getByLabelText('Email de contacto'), 'ops@acme.es');
  await user.click(screen.getByRole('radio', { name: 'Business' }));
}

async function renderForm() {
  renderApp('/customers/new');
  await waitFor(() => expect(screen.getByLabelText('País')).toBeEnabled());
}

beforeEach(() => {
  listCountriesMock.mockReset().mockResolvedValue(countries);
  createCustomerMock.mockReset();
});

describe('CustomerFormPage', () => {
  it('lista los países soportados con su nombre en español y España por defecto', async () => {
    await renderForm();

    const country = screen.getByLabelText('País');
    const options = within(country).getAllByRole<HTMLOptionElement>('option').map((o) => o.textContent);
    expect(options).toEqual(['Alemania', 'España', 'Francia']);
    await waitFor(() => expect(country).toHaveValue('ES'));
  });

  it('registra el cliente y navega a su detalle', async () => {
    const user = userEvent.setup();
    createCustomerMock.mockResolvedValue(created);
    getCustomerMock.mockResolvedValue(created);
    await renderForm();

    await fillForm(user);
    await user.click(screen.getByRole('button', { name: 'Registrar cliente' }));

    expect(createCustomerMock).toHaveBeenCalledWith({
      companyName: 'Acme S.L.',
      taxId: 'B12345674',
      contactEmail: 'ops@acme.es',
      country: 'ES',
      plan: 'business',
    });
    expect(await screen.findByRole('heading', { level: 1, name: 'Acme S.L.' })).toBeInTheDocument();
    expect(getCustomerMock).toHaveBeenCalledWith(42, expect.any(AbortSignal));
  });

  it('muestra los errores de validación junto a cada campo y lleva el foco al primero', async () => {
    const user = userEvent.setup();
    createCustomerMock.mockRejectedValue(
      validationError({
        taxId: 'La letra de control del DNI no es correcta',
        contactEmail: 'El email de contacto no tiene un formato válido',
      }),
    );
    await renderForm();

    await user.click(screen.getByRole('button', { name: 'Registrar cliente' }));

    const taxId = screen.getByLabelText('Identificador fiscal');
    await waitFor(() => expect(taxId).toHaveFocus());
    expect(taxId).toHaveAttribute('aria-invalid', 'true');
    expect(taxId).toHaveAccessibleDescription(/La letra de control del DNI no es correcta/);
    expect(screen.getByLabelText('Email de contacto')).toHaveAccessibleDescription(
      'El email de contacto no tiene un formato válido',
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('al corregir un campo se borra su error y el foco no salta a otro campo', async () => {
    const user = userEvent.setup();
    createCustomerMock.mockRejectedValue(
      validationError({ companyName: 'El nombre de la empresa es obligatorio', taxId: 'El identificador fiscal es obligatorio' }),
    );
    await renderForm();
    await user.click(screen.getByRole('button', { name: 'Registrar cliente' }));

    const companyName = screen.getByLabelText('Nombre de la empresa');
    await waitFor(() => expect(companyName).toHaveFocus());
    await user.type(companyName, 'A');

    expect(screen.queryByText('El nombre de la empresa es obligatorio')).not.toBeInTheDocument();
    expect(screen.getByText('El identificador fiscal es obligatorio')).toBeInTheDocument();
    expect(companyName).toHaveFocus();
  });

  it('muestra el 409 en el campo del identificador fiscal', async () => {
    const user = userEvent.setup();
    createCustomerMock.mockRejectedValue(
      new ApiError(409, 'DUPLICATE_TAX_ID', 'Ya existe un cliente con el identificador fiscal B12345674', {
        taxId: 'Ya existe un cliente con este identificador fiscal',
      }),
    );
    await renderForm();
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: 'Registrar cliente' }));

    expect(await screen.findByText('Ya existe un cliente con este identificador fiscal')).toBeInTheDocument();
    expect(screen.getByLabelText('Identificador fiscal')).toHaveAttribute('aria-invalid', 'true');
  });

  it('un error sin campos (p. ej. red) se muestra como aviso del formulario', async () => {
    const user = userEvent.setup();
    createCustomerMock.mockRejectedValue(new ApiError(0, 'NETWORK_ERROR', 'No se pudo conectar con el servidor'));
    await renderForm();
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: 'Registrar cliente' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo conectar con el servidor');
  });

  it('deshabilita el botón mientras se envía', async () => {
    const user = userEvent.setup();
    createCustomerMock.mockReturnValue(new Promise(() => {}));
    await renderForm();
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: 'Registrar cliente' }));

    expect(screen.getByRole('button', { name: 'Guardando…' })).toBeDisabled();
  });

  it('si no cargan los países muestra el error con Reintentar', async () => {
    const user = userEvent.setup();
    listCountriesMock.mockReset().mockRejectedValueOnce(new ApiError(0, 'NETWORK_ERROR', 'No se pudo conectar con el servidor')).mockResolvedValueOnce(countries);
    renderApp('/customers/new');

    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo conectar con el servidor');
    await user.click(screen.getByRole('button', { name: 'Reintentar' }));
    await waitFor(() => expect(screen.getByLabelText('País')).toHaveValue('ES'));
  });

  it('el error del país se ve aunque la lista de países no haya cargado', async () => {
    const user = userEvent.setup();
    listCountriesMock.mockReset().mockRejectedValue(new ApiError(0, 'NETWORK_ERROR', 'No se pudo conectar con el servidor'));
    createCustomerMock.mockRejectedValue(validationError({ country: 'El país es obligatorio' }));
    renderApp('/customers/new');
    await screen.findByRole('button', { name: 'Reintentar' });

    await user.click(screen.getByRole('button', { name: 'Registrar cliente' }));

    expect(await screen.findByText('El país es obligatorio')).toBeInTheDocument();
  });

  it('el plan conserva su ayuda y enlaza el error cuando lo hay', async () => {
    const user = userEvent.setup();
    createCustomerMock.mockRejectedValue(validationError({ plan: 'El plan es obligatorio' }));
    await renderForm();
    await user.click(screen.getByRole('button', { name: 'Registrar cliente' }));

    const plan = await screen.findByRole('group', { name: 'Plan' });
    await waitFor(() => expect(plan).toHaveAccessibleDescription(/no cambia el precio.*El plan es obligatorio/));
  });
});
