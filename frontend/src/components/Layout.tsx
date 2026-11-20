import { Link, Outlet } from 'react-router-dom';
import { CurrencySelector } from './CurrencySelector';
import { ExchangeRateStatus } from './ExchangeRateStatus';
import './layout.css';

const MAIN_CONTENT_ID = 'contenido';

/** Estructura común: enlace de salto, cabecera con la divisa global, aviso de tipos de cambio y la página activa. */
export function Layout() {
  return (
    <>
      <a className="skip-link" href={`#${MAIN_CONTENT_ID}`}>
        Saltar al contenido
      </a>
      <header className="app-header">
        <Link to="/" className="app-brand">
          SaaS-O-Matic
        </Link>
        <CurrencySelector />
      </header>
      <ExchangeRateStatus />
      <main id={MAIN_CONTENT_ID} className="app-main" tabIndex={-1}>
        <Outlet />
      </main>
    </>
  );
}
