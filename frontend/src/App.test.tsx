import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App';
import { CurrencyProvider } from './features/currency/CurrencyProvider';

describe('App', () => {
  it('muestra el nombre de la aplicación y el selector de divisa', () => {
    render(
      <CurrencyProvider loadRates={() => new Promise(() => {})}>
        <App />
      </CurrencyProvider>,
    );
    expect(screen.getByRole('heading', { level: 1, name: 'SaaS-O-Matic' })).toBeInTheDocument();
    expect(screen.getByLabelText('Divisa')).toBeInTheDocument();
  });
});
