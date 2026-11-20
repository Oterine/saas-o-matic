import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { RatesLoader } from './api/exchangeRates';
import { App } from './App';
import { CurrencyProvider } from './features/currency/CurrencyProvider';

/** Tipos de cambio que no terminan de cargar: la app funciona en EUR sin red. */
const pendingRates: RatesLoader = () => new Promise(() => {});

/** Renderiza la app completa en una ruta, sin red ni navegador real. Solo para tests. */
export function renderApp(path = '/', loadRates: RatesLoader = pendingRates) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <CurrencyProvider loadRates={loadRates}>
        <App />
      </CurrencyProvider>
    </MemoryRouter>,
  );
}
