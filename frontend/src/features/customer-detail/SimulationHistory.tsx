import { useId } from 'react';
import type { Simulation } from '../../api/types';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { ErrorMessage } from '../../components/ErrorMessage';
import { Loading } from '../../components/Loading';
import { BASE_CURRENCY } from '../../config/currencies';
import { useCurrency } from '../../hooks/useCurrency';
import { errorMessage } from '../../utils/errors';
import { formatDateTime, formatNumber, formatPercent } from '../../utils/format';

interface SimulationHistoryProps {
  status: 'loading' | 'success' | 'error';
  simulations: Simulation[] | undefined;
  error: unknown;
  onRetry: () => void;
}

function SimulationItem({ simulation }: { simulation: Simulation }) {
  const { formatCents } = useCurrency();
  return (
    <li className="history-item">
      <p className="history-item__date">
        <time dateTime={simulation.createdAt}>{formatDateTime(simulation.createdAt)}</time>
      </p>
      <dl className="data-list">
        <div>
          <dt>Usuarios activos</dt>
          <dd>{formatNumber(simulation.activeUsers)}</dd>
        </div>
        <div>
          <dt>Almacenamiento</dt>
          <dd>{formatNumber(simulation.storageGb)} GB</dd>
        </div>
        <div>
          <dt>Llamadas a la API</dt>
          <dd>{formatNumber(simulation.apiCalls)}</dd>
        </div>
        <div>
          <dt>Base</dt>
          <dd>{formatCents(simulation.baseCents)}</dd>
        </div>
        <div>
          <dt>Impuesto ({formatPercent(simulation.taxRate)})</dt>
          <dd>{formatCents(simulation.taxCents)}</dd>
        </div>
        <div className="data-list__total">
          <dt>Total mensual</dt>
          <dd>{formatCents(simulation.totalCents)}</dd>
        </div>
      </dl>
    </li>
  );
}

function HistoryContent({ status, simulations, error, onRetry }: SimulationHistoryProps) {
  if (status === 'error') {
    return <ErrorMessage message={errorMessage(error, 'No se pudo cargar el historial')} onRetry={onRetry} />;
  }
  if (!simulations) return <Loading label="Cargando historial…" />;
  if (simulations.length === 0) {
    return <EmptyState title="Todavía no hay simulaciones">Usa el simulador para guardar la primera.</EmptyState>;
  }
  return (
    <ol className="history-list" aria-busy={status === 'loading'}>
      {simulations.map((simulation) => (
        <SimulationItem key={simulation.id} simulation={simulation} />
      ))}
    </ol>
  );
}

/** Historial de simulaciones guardadas, de la más reciente a la más antigua, en la divisa elegida. */
export function SimulationHistory(props: SimulationHistoryProps) {
  const { currency } = useCurrency();
  const titleId = useId();
  return (
    <Card as="section" className="detail-card" labelledBy={titleId}>
      <h2 id={titleId}>Historial de simulaciones</h2>
      {currency !== BASE_CURRENCY && (
        <p className="form-field__hint">Importes convertidos a {currency} con el tipo de cambio actual.</p>
      )}
      <HistoryContent {...props} />
    </Card>
  );
}
