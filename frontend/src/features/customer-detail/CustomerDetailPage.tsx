import { Link, useParams } from 'react-router-dom';
import { getCustomer } from '../../api/customers';
import { ApiError } from '../../api/http';
import { listSimulations } from '../../api/simulations';
import { EmptyState } from '../../components/EmptyState';
import { ErrorMessage } from '../../components/ErrorMessage';
import { Loading } from '../../components/Loading';
import { useAsync } from '../../hooks/useAsync';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { errorMessage } from '../../utils/errors';
import { Simulator } from '../simulator/Simulator';
import { CustomerInfoCard } from './CustomerInfoCard';
import { SimulationHistory } from './SimulationHistory';
import './detail.css';

/** Solo enteros positivos: así una URL como /customers/abc no llega a la API. */
function parseCustomerId(raw: string | undefined): number | undefined {
  return raw && /^[1-9]\d*$/.test(raw) ? Number(raw) : undefined;
}

const NOT_FOUND_TITLE = 'Cliente no encontrado';

/** Sin hook de título: lo pone quien lo renderiza, para que un efecto padre no lo sobrescriba. */
function CustomerNotFound() {
  return (
    <>
      <h1>{NOT_FOUND_TITLE}</h1>
      <EmptyState title="No existe ningún cliente con esa dirección.">
        <Link to="/">Volver al listado de clientes</Link>
      </EmptyState>
    </>
  );
}

function CustomerDetail({ id }: { id: number }) {
  const customer = useAsync((signal) => getCustomer(id, signal), id);
  const history = useAsync((signal) => listSimulations(id, signal), id);
  const notFound = customer.error instanceof ApiError && customer.error.code === 'NOT_FOUND';
  useDocumentTitle(notFound ? NOT_FOUND_TITLE : (customer.data?.companyName ?? 'Detalle del cliente'));

  if (notFound) return <CustomerNotFound />;

  return (
    <>
      <Link to="/" className="button button--secondary back-link">
        <span aria-hidden="true">← </span>Volver a clientes
      </Link>
      <h1>{customer.data?.companyName ?? 'Detalle del cliente'}</h1>

      {customer.status === 'error' && (
        <ErrorMessage message={errorMessage(customer.error, 'No se pudo cargar el cliente')} onRetry={customer.retry} />
      )}
      {customer.status === 'loading' && !customer.data && <Loading label="Cargando cliente…" />}

      {customer.data && (
        <div className="detail-layout">
          <div className="detail-layout__info">
            <CustomerInfoCard customer={customer.data} />
          </div>
          <div className="detail-layout__simulator">
            <Simulator customer={customer.data} onSaved={history.retry} />
          </div>
          <div className="detail-layout__history">
            <SimulationHistory
              status={history.status}
              simulations={history.data}
              error={history.error}
              onRetry={history.retry}
            />
          </div>
        </div>
      )}
    </>
  );
}

function InvalidCustomerId() {
  useDocumentTitle(NOT_FOUND_TITLE);
  return <CustomerNotFound />;
}

/** Detalle del cliente: datos e historial de simulaciones (spec §7). */
export function CustomerDetailPage() {
  const id = parseCustomerId(useParams().id);
  return id === undefined ? <InvalidCustomerId /> : <CustomerDetail key={id} id={id} />;
}
