import type { ReactNode } from 'react';
import './forms.css';

/** Atributos de accesibilidad que enlazan un control con su ayuda y su error. */
export function fieldA11y(id: string, error?: string, hint?: string) {
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ');
  return {
    id,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': describedBy || undefined,
  } as const;
}

interface FormFieldProps {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  /** El control, con los atributos de `fieldA11y(id, error, hint)`. */
  children: ReactNode;
}

/** Etiqueta, control, ayuda y error de un campo. El error se muestra junto al campo (spec §7). */
export function FormField({ id, label, error, hint, children }: FormFieldProps) {
  return (
    <div className={`form-field${error ? ' form-field--invalid' : ''}`}>
      <label htmlFor={id}>{label}</label>
      {children}
      {hint && (
        <p id={`${id}-hint`} className="form-field__hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="form-field__error">
          {error}
        </p>
      )}
    </div>
  );
}
