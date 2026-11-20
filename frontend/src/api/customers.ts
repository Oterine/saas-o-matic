import { request } from './http';
import type { Customer, NewCustomer } from './types';

/** Lista o busca clientes. Un texto vacío o solo con espacios lista todos. */
export function listCustomers(search = '', signal?: AbortSignal): Promise<Customer[]> {
  const query = search.trim() === '' ? '' : `?${new URLSearchParams({ search: search.trim() })}`;
  return request<Customer[]>(`/customers${query}`, { signal });
}

export function getCustomer(id: number, signal?: AbortSignal): Promise<Customer> {
  return request<Customer>(`/customers/${id}`, { signal });
}

export function createCustomer(customer: NewCustomer): Promise<Customer> {
  return request<Customer>('/customers', { method: 'POST', body: customer });
}
