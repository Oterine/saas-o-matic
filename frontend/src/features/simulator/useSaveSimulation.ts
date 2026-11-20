import { useState } from 'react';
import { ApiError } from '../../api/http';
import { createSimulation } from '../../api/simulations';
import type { FieldErrors, SimulationInput } from '../../api/types';
import { errorMessage } from '../../utils/errors';

export interface SimulationDraft {
  activeUsers: string;
  storageGb: string;
  apiCalls: string;
}

/**
 * Texto del campo → número para la API. Un campo vacío se envía ausente (JSON omite undefined)
 * y uno no numérico como NaN (JSON lo envía como null): el backend responde con el mensaje adecuado.
 */
function toNumber(text: string): number | undefined {
  return text.trim() === '' ? undefined : Number(text);
}

/** Guarda la simulación; los errores del backend van a cada campo y el resto a un aviso general. */
export function useSaveSimulation(customerId: number, onSaved: () => void) {
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string>();
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number>();

  async function save(draft: SimulationDraft) {
    setSaving(true);
    setFormError(undefined);
    setSavedAt(undefined);
    const simulation: SimulationInput = {
      customerId,
      activeUsers: toNumber(draft.activeUsers),
      storageGb: toNumber(draft.storageGb),
      apiCalls: toNumber(draft.apiCalls),
    };
    try {
      await createSimulation(simulation);
      setFieldErrors({});
      setSavedAt(Date.now());
      onSaved();
    } catch (error) {
      const { _: general, ...fields } = error instanceof ApiError ? error.fields : {};
      setFieldErrors(fields);
      const hasFieldErrors = Object.keys(fields).length > 0;
      setFormError(general ?? (hasFieldErrors ? undefined : errorMessage(error, 'No se pudo guardar la simulación')));
    } finally {
      setSaving(false);
    }
  }

  function clearFieldError(field: keyof SimulationDraft) {
    setFieldErrors(({ [field]: _removed, ...rest }) => rest);
    setSavedAt(undefined);
  }

  return { save, saving, savedAt, fieldErrors, formError, clearFieldError };
}
