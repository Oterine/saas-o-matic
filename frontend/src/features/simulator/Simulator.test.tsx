import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RatesLoader } from '../../api/exchangeRates';
import { ApiError } from '../../api/http';
import { getPricingPreview } from '../../api/pricing';
import { createSimulation } from '../../api/simulations';
import type { PricingPreview, Simulation } from '../../api/types';
import { CurrencySelector } from '../../components/CurrencySelector';
import { CurrencyProvider } from '../currency/CurrencyProvider';
import { Simulator } from './Simulator';

vi.mock('../../api/pricing', () => ({ getPricingPreview: vi.fn() }));
vi.mock('../../api/simulations', () => ({ createSimulation: vi.fn(), listSimulations: vi.fn() }));
const previewMock = vi.mocked(getPricingPreview);
const createSimulationMock = vi.mocked(createSimulation);

/** Respuestas como las del backend real para ES (21 %), escritas a mano. */
const PREVIEWS: Record<string, PricingPreview> = {
  '10': { activeUsers: 10, baseCents: 10000, taxRate: 0.21, taxCents: 2100, totalCents: 12100, currency: 'EUR' },
  '51': { activeUsers: 51, baseCents: 42500, taxRate: 0.21, taxCents: 8925, totalCents: 51425, currency: 'EUR' },
};

const plain = (text: string | null | undefined) => (text ?? '').replace(/\s/g, ' ');
const total = () => plain(screen.getByText('Total mensual').nextElementSibling?.textContent);

function renderSimulator({ onSaved = vi.fn(), loadRates }: { onSaved?: () => void; loadRates?: RatesLoader } = {}) {
  render(
    <CurrencyProvider loadRates={loadRates ?? (() => new Promise(() => {}))}>
      <CurrencySelector />
      <Simulator customer={{ id: 1, country: 'ES' }} onSaved={onSaved} />
    </CurrencyProvider>,
  );
  return { onSaved };
}

beforeEach(() => {
  previewMock.mockReset().mockImplementation(async (users) => {
    const preview = PREVIEWS[String(users)];
    if (preview) return preview;
    throw new ApiError(422, 'VALIDATION_ERROR', 'Los datos enviados no son válidos', {
      users: 'El número de usuarios debe ser un número entero mayor o igual que 0',
    });
  });
  createSimulationMock.mockReset();
});

describe('Simulator', () => {
  it('pide la vista previa al backend con el país del cliente y muestra base, impuesto y total', async () => {
    renderSimulator();

    await waitFor(() => expect(total()).toBe('121,00 €'));
    expect(previewMock).toHaveBeenCalledWith('10', 'ES', expect.any(AbortSignal));
    expect(screen.getByText('Impuesto (21 %)')).toBeInTheDocument();
  });

  it('al mover el deslizador recalcula en tiempo real (una petición tras el debounce)', async () => {
    renderSimulator();
    await waitFor(() => expect(total()).toBe('121,00 €'));

    const slider = screen.getByRole('slider', { name: 'Usuarios activos (deslizador)' });
    for (const value of ['30', '45', '51']) fireEvent.change(slider, { target: { value } });

    await waitFor(() => expect(total()).toBe('514,25 €'));
    expect(previewMock.mock.calls.map(([users]) => users)).toEqual(['10', '51']);
  });

  it('convierte los importes a la divisa elegida', async () => {
    const user = userEvent.setup();
    renderSimulator({ loadRates: async () => ({ EUR: 1, USD: 1.1 }) });
    await waitFor(() => expect(total()).toBe('121,00 €'));

    await waitFor(() => expect(screen.getByLabelText('Divisa')).toBeEnabled());
    await user.selectOptions(screen.getByLabelText('Divisa'), 'USD');

    expect(total()).toContain('133,10');
  });

  it('un número de usuarios no válido muestra el mensaje del backend en el campo y oculta los importes', async () => {
    const user = userEvent.setup();
    renderSimulator();
    await waitFor(() => expect(total()).toBe('121,00 €'));

    const number = screen.getByRole('spinbutton', { name: 'Usuarios activos (número)' });
    await user.clear(number);

    await waitFor(() =>
      expect(number).toHaveAccessibleDescription(/debe ser un número entero mayor o igual que 0/),
    );
    expect(screen.queryByText('Total mensual')).not.toBeInTheDocument();
  });

  it('guardar envía la simulación, confirma y avisa para refrescar el historial', async () => {
    const user = userEvent.setup();
    createSimulationMock.mockResolvedValue({ id: 9 } as Simulation);
    const { onSaved } = renderSimulator();

    await user.clear(screen.getByLabelText('Almacenamiento (GB)'));
    await user.type(screen.getByLabelText('Almacenamiento (GB)'), '100.5');
    await user.clear(screen.getByLabelText('Llamadas a la API (mes)'));
    await user.type(screen.getByLabelText('Llamadas a la API (mes)'), '50000');
    await user.click(screen.getByRole('button', { name: 'Guardar simulación' }));

    expect(createSimulationMock).toHaveBeenCalledWith({ customerId: 1, activeUsers: 10, storageGb: 100.5, apiCalls: 50000 });
    expect(await screen.findByText('Simulación guardada en el historial.')).toBeInTheDocument();
    expect(onSaved).toHaveBeenCalledOnce();
  });

  it('los errores de validación al guardar se muestran en su campo y no refrescan el historial', async () => {
    const user = userEvent.setup();
    createSimulationMock.mockRejectedValue(
      new ApiError(422, 'VALIDATION_ERROR', 'Los datos enviados no son válidos', {
        storageGb: 'El almacenamiento admite como máximo 2 decimales',
      }),
    );
    const { onSaved } = renderSimulator();

    await user.click(screen.getByRole('button', { name: 'Guardar simulación' }));

    expect(await screen.findByText('El almacenamiento admite como máximo 2 decimales')).toBeInTheDocument();
    expect(screen.getByLabelText('Almacenamiento (GB)')).toHaveAttribute('aria-invalid', 'true');
    expect(onSaved).not.toHaveBeenCalled();
  });

  it('el almacenamiento acepta decimales sin obligar a avanzar de 0,01 en 0,01', () => {
    renderSimulator();
    const storage = screen.getByLabelText('Almacenamiento (GB)');

    expect(storage).toHaveAttribute('step', 'any');
    fireEvent.change(storage, { target: { value: '0.29' } });
    expect(storage).toBeValid();
  });

  it('un campo vacío se envía ausente para que el backend responda "es obligatorio"', async () => {
    const user = userEvent.setup();
    createSimulationMock.mockResolvedValue({ id: 9 } as Simulation);
    renderSimulator();

    await user.clear(screen.getByLabelText('Llamadas a la API (mes)'));
    await user.click(screen.getByRole('button', { name: 'Guardar simulación' }));

    expect(createSimulationMock).toHaveBeenCalledWith({ customerId: 1, activeUsers: 10, storageGb: 0, apiCalls: undefined });
  });
});
