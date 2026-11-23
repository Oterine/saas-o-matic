import { useId } from 'react';
import { fieldA11y } from '../../components/FormField';
import { NumberStepper } from '../../components/NumberStepper';
import { MAX_USERS, SLIDER_MAX_USERS } from '../../config/simulator';
import { formatNumber } from '../../utils/format';

interface UsersInputProps {
  /** Texto del campo numérico: es la fuente de verdad; el deslizador lo refleja. */
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

/** Posición del deslizador para el valor escrito: fuera de rango o no numérico se queda en el extremo. */
function sliderPosition(value: string): number {
  const users = Number(value);
  if (!Number.isFinite(users) || users < 0) return 0;
  return Math.min(Math.trunc(users), SLIDER_MAX_USERS);
}

/** Deslizador (0–200) y campo numérico (hasta 100.000) sincronizados (spec §7, decisión C3). */
export function UsersInput({ value, onChange, error }: UsersInputProps) {
  const id = useId();
  const numberId = `${id}-number`;
  const hint = `El deslizador llega a ${SLIDER_MAX_USERS}; para más usuarios escribe la cifra (hasta ${formatNumber(MAX_USERS)}).`;
  const position = sliderPosition(value);
  // La parte recorrida de la barra se pinta en el color principal; el resto, en gris.
  const fill = `${(position / SLIDER_MAX_USERS) * 100}%`;

  return (
    <fieldset className="form-field users-input">
      <legend>Usuarios activos</legend>
      <div className="users-input__controls">
        <div className="users-input__slider">
          <input
            type="range"
            min={0}
            max={SLIDER_MAX_USERS}
            step={1}
            value={position}
            onChange={(event) => onChange(event.target.value)}
            aria-label="Usuarios activos (deslizador)"
            aria-describedby={`${numberId}-hint`}
            style={{
              background: `linear-gradient(to right, var(--color-primary) ${fill}, var(--color-input-border) ${fill})`,
            }}
          />
          <div className="users-input__scale" aria-hidden="true">
            <span>0</span>
            <span>{SLIDER_MAX_USERS}</span>
          </div>
        </div>
        <label htmlFor={numberId} className="visually-hidden">
          Usuarios activos (número)
        </label>
        <NumberStepper
          {...fieldA11y(numberId, error, hint)}
          name="activeUsers"
          inputMode="numeric"
          step={1}
          max={MAX_USERS}
          value={value}
          onValueChange={onChange}
          decreaseLabel="Reducir usuarios activos"
          increaseLabel="Aumentar usuarios activos"
        />
      </div>
      <p id={`${numberId}-hint`} className="form-field__hint">
        {hint}
      </p>
      {error && (
        <p id={`${numberId}-error`} className="form-field__error">
          {error}
        </p>
      )}
    </fieldset>
  );
}
