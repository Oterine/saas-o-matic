import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { CustomerDetailPage } from './features/customer-detail/CustomerDetailPage';
import { CustomerFormPage } from './features/customers/CustomerFormPage';
import { CustomerListPage } from './features/customers/CustomerListPage';
import { NotFoundPage } from './features/not-found/NotFoundPage';

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<CustomerListPage />} />
        <Route path="customers/new" element={<CustomerFormPage />} />
        <Route path="customers/:id" element={<CustomerDetailPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
