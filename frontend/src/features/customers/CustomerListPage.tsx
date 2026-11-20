import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { listCustomers } from '../../api/customers';
import type { Customer } from '../../api/types';
import { EmptyState } from '../../components/EmptyState';
import { ErrorMessage } from '../../components/ErrorMessage';
import { Loading } from '../../components/Loading';
import { SEARCH_DEBOUNCE_MS } from '../../config/search';
import { useAsync } from '../../hooks/useAsync';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { errorMessage } from '../../utils/errors';
import { CustomerCard } from './CustomerCard';

function resultsLabel(count: number): string {
  return count === 1 ? '1 cliente' : `${count} clientes`;
}

function NoResults({ search }: { search: string }) {
  if (search === '') {
    return (
      <EmptyState title="Todavía no hay clientes">
        <Link to="/customers/new">Registra el primero</Link>
      </EmptyState>
    );
  }
  return <EmptyState title={`No hay clientes que coincidan con «${search}»`}>Prueba con otro nombre o identificador.</EmptyState>;
}

function CustomerList({ customers, search }: { customers: Customer[]; search: string }) {
  if (customers.length === 0) return <NoResults search={search} />;
  return (
    <ul className="customer-list">
      {customers.map((customer) => (
        <CustomerCard key={customer.id} customer={customer} />
      ))}
    </ul>
  );
}

/** Dashboard: buscador con debounce y lista de clientes en tarjetas (spec §7). */
export function CustomerListPage() {
  useDocumentTitle('Clientes');
  const searchId = useId();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search.trim(), SEARCH_DEBOUNCE_MS);

  const { status, data, error, retry } = useAsync(
    (signal) => listCustomers(debouncedSearch, signal),
    debouncedSearch,
  );

  return (
    <>
      <div className="page-header">
        <h1>Clientes</h1>
        <Link to="/customers/new" className="button">
          Nuevo cliente
        </Link>
      </div>

      <div className="search-field">
        <label htmlFor={searchId}>Buscar por empresa o identificador fiscal</label>
        <input
          id={searchId}
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Ej.: Acme o B12345674"
          autoComplete="off"
        />
      </div>

      <p className="visually-hidden" role="status">
        {status === 'success' && data ? resultsLabel(data.length) : ''}
      </p>

      {status === 'error' && <ErrorMessage message={errorMessage(error, 'No se pudo cargar la lista de clientes')} onRetry={retry} />}
      {status === 'loading' && !data && <Loading label="Cargando clientes…" />}
      {status !== 'error' && data && (
        <div aria-busy={status === 'loading'}>
          <CustomerList customers={data} search={debouncedSearch} />
        </div>
      )}
    </>
  );
}
