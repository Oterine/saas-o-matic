import { useId, type ChangeEvent } from 'react';
import { LOCALE, type CurrencyCode } from '../config/currencies';
import { useCurrency } from '../hooks/useCurrency';

const currencyNames = new Intl.DisplayNames(LOCALE, { type: 'currency' });

/** "USD · dólar estadounidense": el código solo no siempre se reconoce. */
const currencyLabel = (code: CurrencyCode) => `${code} · ${currencyNames.of(code) ?? code}`;

/** Selector global de divisa. Solo se puede cambiar cuando los tipos de cambio están cargados. */
export function CurrencySelector() {
  const { currency, available, setCurrency, ratesStatus } = useCurrency();
  const id = useId();

  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    const next = available.find((code) => code === event.target.value);
    if (next) setCurrency(next);
  }

  return (
    <div className="currency-selector">
      <label htmlFor={id}>Divisa</label>
      <select id={id} value={currency} disabled={ratesStatus !== 'ready'} onChange={handleChange}>
        {available.map((code) => (
          <option key={code} value={code}>
            {currencyLabel(code)}
          </option>
        ))}
      </select>
    </div>
  );
}
