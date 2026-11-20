import { describe, expect, it } from 'vitest';
import { calculateBaseCents, calculateQuote, calculateTaxCents } from '../src/domain/pricing.js';

describe('calculateBaseCents (tramos acumulativos)', () => {
  it.each([
    [0, 0],
    [1, 1000],
    [10, 10000],
    [11, 10800],
    [15, 14000],
    [50, 42000],
    [51, 42500],
    [100, 67000],
  ])('%i usuarios -> %i céntimos', (users, expected) => {
    expect(calculateBaseCents(users)).toBe(expected);
  });

  it.each([-1, 1.5, Number.NaN])('rechaza usuarios inválidos (%s)', (users) => {
    expect(() => calculateBaseCents(users)).toThrow(RangeError);
  });
});

describe('calculateTaxCents', () => {
  it('calcula el 21 %', () => {
    expect(calculateTaxCents(14000, 21)).toBe(2940);
  });

  it('devuelve 0 con tasa 0', () => {
    expect(calculateTaxCents(14000, 0)).toBe(0);
  });

  it('redondea half-up', () => {
    expect(calculateTaxCents(250, 21)).toBe(53); // 52,5 -> 53
  });

  it('rechaza tasas negativas', () => {
    expect(() => calculateTaxCents(100, -1)).toThrow(RangeError);
  });
});

describe('calculateQuote', () => {
  it('15 usuarios en España: 140 € + 21 %', () => {
    expect(calculateQuote(15, 21)).toEqual({ baseCents: 14000, taxCents: 2940, totalCents: 16940 });
  });
});
