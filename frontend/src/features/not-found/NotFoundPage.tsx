import { Link } from 'react-router-dom';
import { EmptyState } from '../../components/EmptyState';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export function NotFoundPage() {
  useDocumentTitle('Página no encontrada');
  return (
    <>
      <h1>Página no encontrada</h1>
      <EmptyState title="La dirección no corresponde a ninguna página.">
        <Link to="/">Volver al listado de clientes</Link>
      </EmptyState>
    </>
  );
}
