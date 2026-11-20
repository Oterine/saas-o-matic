import { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listCountries } from '../../api/countries';
import type { Plan } from '../../api/types';
import { ErrorMessage } from '../../components/ErrorMessage';
import { FormField, fieldA11y } from '../../components/FormField';
import { useAsync } from '../../hooks/useAsync';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { countryName, planLabel } from '../../utils/display';
import { errorMessage } from '../../utils/errors';
import { CUSTOMER_FIELDS, useCustomerForm } from './useCustomerForm';

const PLANS: readonly Plan[] = ['starter', 'business', 'enterprise'];
const DEFAULT_COUNTRY = 'ES';
const TAX_ID_HINT = 'DNI, NIE o CIF si el país es España.';

/** Alta de cliente con errores por campo y foco en el primero (spec §7). */
export function CustomerFormPage() {
  useDocumentTitle('Nuevo cliente');
  const navigate = useNavigate();
  const { values, setField, fieldErrors, formError, submitting, submit, rejectedSubmits } = useCustomerForm(
    (customer) => navigate(`/customers/${customer.id}`),
  );
  const countries = useAsync(listCountries);
  const formRef = useRef<HTMLFormElement>(null);

  // País por defecto en cuanto llega la lista (España si está soportada).
  useEffect(() => {
    const codes = countries.data?.map((c) => c.code) ?? [];
    if (values.country === '' && codes.length > 0) {
      setField('country', codes.includes(DEFAULT_COUNTRY) ? DEFAULT_COUNTRY : (codes[0] ?? ''));
    }
  }, [countries.data, values.country, setField]);

  // Foco al primer campo con error solo tras un envío rechazado. Depende a propósito solo de
  // `rejectedSubmits`: si dependiera de `fieldErrors`, el foco saltaría mientras el usuario corrige.
  useEffect(() => {
    if (rejectedSubmits === 0) return;
    const first = CUSTOMER_FIELDS.find((field) => fieldErrors[field]);
    if (first) formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
  }, [rejectedSubmits]);

  return (
    <>
      <h1>Nuevo cliente</h1>
      <form ref={formRef} className="form" onSubmit={submit} noValidate>
        {formError && <ErrorMessage message={formError} />}

        <FormField id="companyName" label="Nombre de la empresa" error={fieldErrors.companyName}>
          <input
            {...fieldA11y('companyName', fieldErrors.companyName)}
            name="companyName"
            value={values.companyName}
            onChange={(e) => setField('companyName', e.target.value)}
            maxLength={200}
            autoComplete="organization"
            required
          />
        </FormField>

        <FormField id="taxId" label="Identificador fiscal" hint={TAX_ID_HINT} error={fieldErrors.taxId}>
          <input
            {...fieldA11y('taxId', fieldErrors.taxId, TAX_ID_HINT)}
            name="taxId"
            value={values.taxId}
            onChange={(e) => setField('taxId', e.target.value)}
            autoComplete="off"
            required
          />
        </FormField>

        <FormField id="contactEmail" label="Email de contacto" error={fieldErrors.contactEmail}>
          <input
            {...fieldA11y('contactEmail', fieldErrors.contactEmail)}
            name="contactEmail"
            type="email"
            value={values.contactEmail}
            onChange={(e) => setField('contactEmail', e.target.value)}
            maxLength={254}
            autoComplete="email"
            required
          />
        </FormField>

        {/* El campo se pinta siempre, para que su error del backend se vea aunque la lista no cargue. */}
        <FormField id="country" label="País" error={fieldErrors.country}>
          {countries.status === 'error' ? (
            <ErrorMessage
              message={errorMessage(countries.error, 'No se pudo cargar la lista de países')}
              onRetry={countries.retry}
            />
          ) : (
            <select
              {...fieldA11y('country', fieldErrors.country)}
              name="country"
              value={values.country}
              onChange={(e) => setField('country', e.target.value)}
              disabled={!countries.data}
              required
            >
              {!countries.data && <option value="">Cargando países…</option>}
              {countries.data?.map(({ code }) => (
                <option key={code} value={code}>
                  {countryName(code)}
                </option>
              ))}
            </select>
          )}
        </FormField>

        <fieldset className="form-field" aria-describedby={fieldErrors.plan ? 'plan-hint plan-error' : 'plan-hint'}>
          <legend>Plan</legend>
          <div className="radio-group">
            {PLANS.map((plan) => (
              <label key={plan} className="radio">
                <input
                  type="radio"
                  name="plan"
                  value={plan}
                  checked={values.plan === plan}
                  onChange={() => setField('plan', plan)}
                />
                {planLabel(plan)}
              </label>
            ))}
          </div>
          <p id="plan-hint" className="form-field__hint">
            El plan es una etiqueta comercial: no cambia el precio.
          </p>
          {fieldErrors.plan && (
            <p id="plan-error" className="form-field__error">
              {fieldErrors.plan}
            </p>
          )}
        </fieldset>

        <div className="form-actions">
          <button type="submit" className="button" disabled={submitting}>
            {submitting ? 'Guardando…' : 'Registrar cliente'}
          </button>
          <Link to="/">Cancelar</Link>
        </div>
      </form>
    </>
  );
}
