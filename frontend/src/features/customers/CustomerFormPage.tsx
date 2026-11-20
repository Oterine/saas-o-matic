import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export function CustomerFormPage() {
  useDocumentTitle('Nuevo cliente');
  return <h1>Nuevo cliente</h1>;
}
