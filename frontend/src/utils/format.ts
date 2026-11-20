import { LOCALE } from '../config/currencies';

const dateFormat = new Intl.DateTimeFormat(LOCALE, { dateStyle: 'long' });
const dateTimeFormat = new Intl.DateTimeFormat(LOCALE, { dateStyle: 'medium', timeStyle: 'short' });
const numberFormat = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 2 });
const percentFormat = new Intl.NumberFormat(LOCALE, { style: 'percent', maximumFractionDigits: 2 });

/** "2026-11-20T10:00:00Z" → "20 de noviembre de 2026" (zona horaria del navegador). */
export const formatDate = (iso: string): string => dateFormat.format(new Date(iso));

/** "2026-11-20T10:00:00Z" → "20 nov 2026, 11:00" (zona horaria del navegador). */
export const formatDateTime = (iso: string): string => dateTimeFormat.format(new Date(iso));

/** 50000 → "50.000"; 100.5 → "100,5". */
export const formatNumber = (value: number): string => numberFormat.format(value);

/** 0.21 → "21 %". */
export const formatPercent = (fraction: number): string => percentFormat.format(fraction);
