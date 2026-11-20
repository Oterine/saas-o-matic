import { describe, expect, it } from 'vitest';
import { formatDate, formatDateTime, formatNumber, formatPercent } from './format';

const plain = (text: string) => text.replace(/\s/g, ' ');

describe('format', () => {
  it('formatNumber usa separador de miles y coma decimal', () => {
    expect(formatNumber(50000)).toBe('50.000');
    expect(formatNumber(0.29)).toBe('0,29');
    expect(formatNumber(15)).toBe('15');
  });

  it('formatPercent muestra la tasa como porcentaje', () => {
    expect(plain(formatPercent(0.21))).toBe('21 %');
    expect(plain(formatPercent(0))).toBe('0 %');
  });

  it('formatDate y formatDateTime usan el formato español', () => {
    // Mediodía UTC: el día es el mismo en cualquier zona horaria razonable.
    expect(formatDate('2026-11-20T12:00:00Z')).toBe('20 de noviembre de 2026');
    expect(formatDateTime('2026-11-20T12:00:00Z')).toMatch(/^20 nov 2026, \d{1,2}:00$/);
  });
});
