import { useCurrency } from '../hooks/useCurrency';

/** Estados obligatorios de la API de divisas: cargando y error con reintento (con fallback a EUR). */
export function ExchangeRateStatus() {
  const { ratesStatus, retryRates } = useCurrency();

  if (ratesStatus === 'loading') {
    return (
      <p className="notice notice--info" role="status">
        Cargando tipos de cambio…
      </p>
    );
  }

  if (ratesStatus === 'error') {
    return (
      <div className="notice notice--warning" role="alert">
        <span>No se han podido cargar los tipos de cambio. Los importes se muestran en EUR.</span>
        <button type="button" className="button button--secondary" onClick={retryRates}>
          Reintentar
        </button>
      </div>
    );
  }

  return null;
}
