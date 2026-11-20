import { LOCALE, type CurrencyCode } from '../config/currencies';

const formatters = new Map<CurrencyCode, Intl.NumberFormat>();

function formatterFor(currency: CurrencyCode): Intl.NumberFormat {
  let formatter = formatters.get(currency);
  if (!formatter) {
    formatter = new Intl.NumberFormat(LOCALE, { style: 'currency', currency });
    formatters.set(currency, formatter);
  }
  return formatter;
}

/**
 * Solo para mostrar: céntimos de EUR → importe en la divisa elegida (spec §7).
 * Los cálculos de dinero se hacen siempre en el backend, en céntimos enteros.
 */
export function formatMoney(cents: number, currency: CurrencyCode, rate: number): string {
  return formatterFor(currency).format((cents / 100) * rate);
}
