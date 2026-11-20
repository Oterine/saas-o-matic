import { CurrencySelector } from './components/CurrencySelector';
import { ExchangeRateStatus } from './components/ExchangeRateStatus';

export function App() {
  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>SaaS-O-Matic</h1>
          <p className="app-subtitle">Simulador de suscripciones para el equipo comercial</p>
        </div>
        <CurrencySelector />
      </header>
      <ExchangeRateStatus />
    </div>
  );
}
