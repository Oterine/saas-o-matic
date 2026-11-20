import { useId, useState, type FormEvent } from 'react';
import { ApiError } from '../../api/http';
import type { Customer } from '../../api/types';
import { Card } from '../../components/Card';
import { ErrorMessage } from '../../components/ErrorMessage';
import { FormField, fieldA11y } from '../../components/FormField';
import { DEFAULT_SIMULATION } from '../../config/simulator';
import { usePricingPreview } from '../../hooks/usePricingPreview';
import { errorMessage } from '../../utils/errors';
import { QuoteSummary } from './QuoteSummary';
import { UsersInput } from './UsersInput';
import { useSaveSimulation, type SimulationDraft } from './useSaveSimulation';
import './simulator.css';

interface SimulatorProps {
  customer: Pick<Customer, 'id' | 'country'>;
  /** Se llama tras guardar, para refrescar el historial sin recargar la página. */
  onSaved: () => void;
}

/** Error de la vista previa asociado al campo de usuarios (422), si lo hay. */
function previewUsersError(error: unknown): string | undefined {
  return error instanceof ApiError ? error.fields.users : undefined;
}

/** Simulador interactivo: presupuesto en tiempo real desde el backend y guardado (spec §7). */
export function Simulator({ customer, onSaved }: SimulatorProps) {
  const titleId = useId();
  const [draft, setDraft] = useState<SimulationDraft>({ ...DEFAULT_SIMULATION });
  const preview = usePricingPreview(draft.activeUsers, customer.country);
  const { save, saving, savedAt, fieldErrors, formError, clearFieldError } = useSaveSimulation(customer.id, onSaved);

  function update(field: keyof SimulationDraft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
    clearFieldError(field);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void save(draft);
  }

  const usersError = fieldErrors.activeUsers ?? (preview.status === 'error' ? previewUsersError(preview.error) : undefined);
  const previewFailed = preview.status === 'error' && !previewUsersError(preview.error);

  return (
    <Card as="section" className="detail-card simulator" labelledBy={titleId}>
      <h2 id={titleId}>Simulador</h2>
      <form className="form" onSubmit={handleSubmit} noValidate>
        <UsersInput value={draft.activeUsers} onChange={(value) => update('activeUsers', value)} error={usersError} />

        <div className="form-row">
          <FormField id="storageGb" label="Almacenamiento (GB)" error={fieldErrors.storageGb}>
            <input
              {...fieldA11y('storageGb', fieldErrors.storageGb)}
              name="storageGb"
              type="number"
              inputMode="decimal"
              min={0}
              // "any": las flechas suben de 1 en 1 y se pueden escribir decimales (el máximo de 2 lo valida el backend).
              step="any"
              value={draft.storageGb}
              onChange={(event) => update('storageGb', event.target.value)}
            />
          </FormField>
          <FormField id="apiCalls" label="Llamadas a la API (mes)" error={fieldErrors.apiCalls}>
            <input
              {...fieldA11y('apiCalls', fieldErrors.apiCalls)}
              name="apiCalls"
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              value={draft.apiCalls}
              onChange={(event) => update('apiCalls', event.target.value)}
            />
          </FormField>
        </div>
        <p className="form-field__hint">El precio depende solo de los usuarios; almacenamiento y llamadas se guardan como referencia.</p>

        {previewFailed && (
          <ErrorMessage message={errorMessage(preview.error, 'No se pudo calcular el presupuesto')} onRetry={preview.retry} />
        )}
        {/* Con un error no se muestran importes anteriores: no corresponderían a lo escrito. */}
        {preview.status !== 'error' && <QuoteSummary preview={preview.data} updating={preview.status === 'loading'} />}

        {formError && <ErrorMessage message={formError} />}
        <div className="form-actions">
          <button type="submit" className="button" disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar simulación'}
          </button>
          <p className="simulator__saved" role="status">
            {savedAt ? 'Simulación guardada en el historial.' : ''}
          </p>
        </div>
      </form>
    </Card>
  );
}
