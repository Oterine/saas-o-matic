import { useEffect, useRef } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { CurrencySelector } from './CurrencySelector';
import { ExchangeRateStatus } from './ExchangeRateStatus';
import './layout.css';

const MAIN_CONTENT_ID = 'contenido';

/**
 * Al cambiar de página, el foco pasa al contenido principal para que el lector de pantalla la anuncie
 * (en una SPA el navegador no lo hace). Se compara con la ruta anterior, así que no salta al cargar.
 */
function useFocusMainOnNavigation() {
  const { pathname } = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const previousPath = useRef(pathname);

  useEffect(() => {
    if (previousPath.current === pathname) return;
    previousPath.current = pathname;
    mainRef.current?.focus();
  }, [pathname]);

  return mainRef;
}

/** Estructura común: enlace de salto, cabecera con la divisa global, aviso de tipos de cambio y la página activa. */
export function Layout() {
  const mainRef = useFocusMainOnNavigation();

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
      <main id={MAIN_CONTENT_ID} ref={mainRef} className="app-main" tabIndex={-1}>
        <Outlet />
      </main>
    </>
  );
}
