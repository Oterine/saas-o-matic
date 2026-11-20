import { useCallback, useState, type FormEvent } from 'react';
import { createCustomer } from '../../api/customers';
import { ApiError } from '../../api/http';
import type { Customer, FieldErrors, NewCustomer } from '../../api/types';
import { errorMessage } from '../../utils/errors';

export type CustomerField = keyof NewCustomer;

/** Orden de los campos en pantalla: el foco va al primero con error. */
export const CUSTOMER_FIELDS: readonly CustomerField[] = ['companyName', 'taxId', 'contactEmail', 'country', 'plan'];

const INITIAL_VALUES: NewCustomer = {
  companyName: '',
  taxId: '',
  contactEmail: '',
  country: '',
  plan: 'starter',
};

/**
 * Estado y envío del alta. La validación es la del backend (una sola fuente de reglas y mensajes):
 * los errores de `fields` se muestran junto a cada campo y el resto como aviso del formulario.
 */
export function useCustomerForm(onCreated: (customer: Customer) => void) {
  const [values, setValues] = useState<NewCustomer>(INITIAL_VALUES);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  /** Aumenta con cada envío rechazado: la página lo usa para mover el foco solo entonces. */
  const [rejectedSubmits, setRejectedSubmits] = useState(0);

  const setField = useCallback(<K extends CustomerField>(field: K, value: NewCustomer[K]) => {
    setValues((current) => ({ ...current, [field]: value }));
    setFieldErrors(({ [field]: _removed, ...rest }) => rest);
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setFormError(undefined);
    try {
      onCreated(await createCustomer(values));
    } catch (error) {
      const { _: general, ...fields } = error instanceof ApiError ? error.fields : {};
      const hasFieldErrors = Object.keys(fields).length > 0;
      setFieldErrors(fields);
      setFormError(general ?? (hasFieldErrors ? undefined : errorMessage(error, 'No se pudo registrar el cliente')));
      setRejectedSubmits((n) => n + 1);
    } finally {
      setSubmitting(false);
    }
  }

  return { values, setField, fieldErrors, formError, submitting, submit, rejectedSubmits };
}
