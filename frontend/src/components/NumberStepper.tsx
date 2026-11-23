import type { InputHTMLAttributes } from 'react';
import './number-stepper.css';

interface NumberStepperProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange' | 'min' | 'max'> {
  id: string;
  /** Texto del campo: es la fuente de verdad (puede estar vacío o no ser válido; el backend lo valida). */
  value: string;
  onValueChange: (value: string) => void;
  /** Nombres accesibles de los botones, p. ej. "Reducir almacenamiento" / "Aumentar almacenamiento". */
  decreaseLabel: string;
  increaseLabel: string;
  /** Cuánto suma o resta cada botón (por defecto 1). */
  increment?: number;
  min?: number;
  max?: number;
}

/**
 * Valor tras pulsar −/+: un campo vacío o no numérico parte del mínimo, el resultado se limita al rango
 * y se redondea a 2 decimales para no arrastrar errores de coma flotante (0.29 + 1 = 1.29).
 */
export function stepValue(value: string, delta: number, min = 0, max = Number.POSITIVE_INFINITY): string {
  const current = Number(value);
  const base = value.trim() === '' || !Number.isFinite(current) ? min : current;
  const next = Math.round((base + delta) * 100) / 100;
  return String(Math.min(max, Math.max(min, next)));
}

/**
 * Campo numérico con botones −/+ propios en lugar de las flechas nativas.
 * Los botones quedan fuera del orden de tabulación: con teclado se usa ↑/↓ en el propio campo.
 */
export function NumberStepper({
  id,
  value,
  onValueChange,
  decreaseLabel,
  increaseLabel,
  increment = 1,
  min = 0,
  max,
  ...inputProps
}: NumberStepperProps) {
  const current = Number(value);
  const atMin = value.trim() !== '' && Number.isFinite(current) && current <= min;
  const atMax = max !== undefined && Number.isFinite(current) && current >= max;

  return (
    <div className="number-stepper">
      <button
        type="button"
        className="number-stepper__button"
        aria-label={decreaseLabel}
        aria-controls={id}
        tabIndex={-1}
        disabled={atMin}
        onClick={() => onValueChange(stepValue(value, -increment, min, max))}
      >
        <span aria-hidden="true">−</span>
      </button>
      <input
        {...inputProps}
        id={id}
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
      />
      <button
        type="button"
        className="number-stepper__button"
        aria-label={increaseLabel}
        aria-controls={id}
        tabIndex={-1}
        disabled={atMax}
        onClick={() => onValueChange(stepValue(value, increment, min, max))}
      >
        <span aria-hidden="true">+</span>
      </button>
    </div>
  );
}
