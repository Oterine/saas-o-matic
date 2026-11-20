import { describe, expect, it } from 'vitest';
import { normalizeTaxId, validateTaxId, validateSpanishTaxId } from '../src/domain/taxId.js';

describe('normalizeTaxId', () => {
  it('pasa a mayúsculas y quita espacios, guiones y puntos', () => {
    expect(normalizeTaxId(' b-1234.567 4 ')).toBe('B12345674');
  });
});

describe('DNI', () => {
  it('acepta uno válido', () => {
    expect(validateSpanishTaxId('12345678Z')).toMatchObject({ valid: true, type: 'DNI' });
  });
  it('acepta minúsculas y guiones', () => {
    expect(validateSpanishTaxId('12345678-z').valid).toBe(true);
  });
  it('rechaza letra incorrecta', () => {
    expect(validateSpanishTaxId('12345678A').valid).toBe(false);
  });
});

describe('NIE', () => {
  it('acepta uno válido', () => {
    expect(validateSpanishTaxId('X1234567L')).toMatchObject({ valid: true, type: 'NIE' });
  });
  it('rechaza letra incorrecta', () => {
    expect(validateSpanishTaxId('X1234567A').valid).toBe(false);
  });
});

describe('CIF', () => {
  it.each(['A58818501', 'B12345674', 'P1234567D', 'Q2826000H', 'N0123456F'])('acepta %s', (cif) => {
    expect(validateSpanishTaxId(cif)).toMatchObject({ valid: true, type: 'CIF' });
  });

  it('rechaza control incorrecto', () => {
    expect(validateSpanishTaxId('A58818502').valid).toBe(false);
  });
  it('exige letra en tipos P/Q/R/S/N/W', () => {
    expect(validateSpanishTaxId('P12345674').valid).toBe(false);
  });
  it('exige dígito en tipos A/B/E/H', () => {
    expect(validateSpanishTaxId('B1234567D').valid).toBe(false);
  });
});

describe('formato', () => {
  it.each(['', '123', 'ABCDEFGHI', '1234567890'])('rechaza formato no reconocido (%s)', (id) => {
    const result = validateSpanishTaxId(id);
    expect(result.valid).toBe(false);
    expect(result.reason).toBeTruthy();
  });
});

describe('validateTaxId según país', () => {
  it('ES usa el algoritmo oficial', () => {
    expect(validateTaxId('12345678A', 'ES').valid).toBe(false);
  });
  it('otros países solo validan formato genérico', () => {
    expect(validateTaxId('FR-12345678', 'FR')).toMatchObject({ valid: true, type: 'OTHER' });
    expect(validateTaxId('ab', 'FR').valid).toBe(false);
  });
});
