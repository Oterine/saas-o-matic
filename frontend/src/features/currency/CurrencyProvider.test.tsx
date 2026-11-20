import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { RatesLoader } from '../../api/exchangeRates';
import { CurrencySelector } from '../../components/CurrencySelector';
import { ExchangeRateStatus } from '../../components/ExchangeRateStatus';
import { useCurrency } from '../../hooks/useCurrency';
import { CurrencyProvider } from './CurrencyProvider';

const rates = { EUR: 1, USD: 1.1, GBP: 0.85, CHF: 0.95, JPY: 160.5, MXN: 18.2 };

function Amount() {
  const { formatCents } = useCurrency();
  return <span aria-label="Total">{formatCents(14000)}</span>;
}

function renderWithRates(loadRates: RatesLoader) {
  return render(
    <CurrencyProvider loadRates={loadRates}>
      <CurrencySelector />
      <ExchangeRateStatus />
      <Amount />
    </CurrencyProvider>,
  );
}

const total = () => screen.getByLabelText('Total').textContent?.replace(/\s/g, ' ');

describe('CurrencyProvider + selector', () => {
  it('mientras carga: muestra el estado, deshabilita el selector y usa EUR', () => {
    renderWithRates(() => new Promise(() => {}));

    expect(screen.getByRole('status')).toHaveTextContent('Cargando tipos de cambio…');
    expect(screen.getByLabelText('Divisa')).toBeDisabled();
    expect(total()).toBe('140,00 €');
  });

  it('al cambiar de divisa, actualiza los importes sin recargar', async () => {
    const user = userEvent.setup();
    renderWithRates(vi.fn().mockResolvedValue(rates));

    const select = await screen.findByRole('combobox', { name: 'Divisa' });
    await waitFor(() => expect(select).toBeEnabled());
    expect(screen.queryByRole('status')).not.toBeInTheDocument();

    await user.selectOptions(select, 'USD');
    expect(total()).toContain('154,00');

    await user.selectOptions(select, 'EUR');
    expect(total()).toBe('140,00 €');
  });

  it('si la API falla: aviso con Reintentar, fallback a EUR y recuperación', async () => {
    const user = userEvent.setup();
    const loader = vi.fn<RatesLoader>().mockRejectedValueOnce(new Error('caída')).mockResolvedValueOnce(rates);
    renderWithRates(loader);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Los importes se muestran en EUR');
    expect(screen.getByLabelText('Divisa')).toBeDisabled();
    expect(total()).toBe('140,00 €');

    await user.click(screen.getByRole('button', { name: 'Reintentar' }));

    await waitFor(() => expect(screen.getByLabelText('Divisa')).toBeEnabled());
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('solo ofrece las divisas que tienen tipo de cambio, con su nombre en español', async () => {
    renderWithRates(vi.fn().mockResolvedValue({ EUR: 1, USD: 1.1 }));

    await waitFor(() => expect(screen.getByLabelText('Divisa')).toBeEnabled());
    const options = screen.getAllByRole<HTMLOptionElement>('option');
    expect(options.map((option) => option.value)).toEqual(['EUR', 'USD']);
    expect(options.map((option) => option.textContent)).toEqual(['EUR · euro', 'USD · dólar estadounidense']);
  });
});
