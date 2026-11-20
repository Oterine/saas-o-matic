import { describe, expect, it } from 'vitest';
import { formatMoney } from './money';

/** Intl usa espacios no separables; se normalizan para comparar. */
const plain = (text: string) => text.replace(/\s/g, ' ');

describe('formatMoney', () => {
  it('formatea céntimos de EUR en formato español', () => {
    expect(plain(formatMoney(14000, 'EUR', 1))).toBe('140,00 €');
    expect(plain(formatMoney(1694050, 'EUR', 1))).toBe('16.940,50 €');
  });

  it('convierte con el tipo de cambio: céntimos / 100 × tipo', () => {
    expect(plain(formatMoney(14000, 'USD', 1.1))).toContain('154,00');
  });

  it('respeta los decimales propios de cada divisa (JPY sin decimales)', () => {
    const yen = plain(formatMoney(14000, 'JPY', 160.5));
    expect(yen).toContain('22.470');
    expect(yen).not.toContain(',');
  });

  it('formatea 0 sin problemas', () => {
    expect(plain(formatMoney(0, 'EUR', 1))).toBe('0,00 €');
  });
});
