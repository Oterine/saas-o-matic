export type TaxIdType = 'DNI' | 'NIE' | 'CIF' | 'OTHER';

export interface TaxIdResult {
  valid: boolean;
  type?: TaxIdType;
  /** Identificador normalizado (mayúsculas, sin espacios ni guiones). */
  normalized: string;
  /** Motivo del rechazo, listo para mostrar al usuario. */
  reason?: string;
}

const DNI_LETTERS = 'TRWAGMYFPDXBNJZSQVHLCKE';
const CIF_CONTROL_LETTERS = 'JABCDEFGHI';
/** Tipos de entidad cuyo control es siempre una letra / siempre un dígito. */
const CIF_LETTER_ONLY = 'NPQRSW';
const CIF_DIGIT_ONLY = 'ABEH';

const DNI_REGEX = /^\d{8}[A-Z]$/;
const NIE_REGEX = /^[XYZ]\d{7}[A-Z]$/;
const CIF_REGEX = /^[ABCDEFGHJNPQRSUVW]\d{7}[0-9A-J]$/;
const GENERIC_REGEX = /^[A-Z0-9]{5,20}$/;

export function normalizeTaxId(raw: string): string {
  return raw.toUpperCase().replace(/[\s\-.]/g, '');
}

function invalid(normalized: string, reason: string): TaxIdResult {
  return { valid: false, normalized, reason };
}

function dniLetter(num: number): string {
  return DNI_LETTERS[num % 23] as string;
}

function validateDni(id: string): TaxIdResult {
  const expected = dniLetter(Number(id.slice(0, 8)));
  return id[8] === expected
    ? { valid: true, type: 'DNI', normalized: id }
    : invalid(id, 'La letra de control del DNI no es correcta');
}

function validateNie(id: string): TaxIdResult {
  const prefix = 'XYZ'.indexOf(id[0] as string);
  const expected = dniLetter(Number(`${prefix}${id.slice(1, 8)}`));
  return id[8] === expected
    ? { valid: true, type: 'NIE', normalized: id }
    : invalid(id, 'La letra de control del NIE no es correcta');
}

function validateCif(id: string): TaxIdResult {
  const entityType = id[0] as string;
  const digits = id.slice(1, 8);
  const control = id[8] as string;

  let sum = 0;
  for (let i = 0; i < 7; i++) {
    const digit = Number(digits[i]);
    if (i % 2 === 0) {
      // posiciones impares (1.ª, 3.ª...): se duplica y se suman las cifras
      const doubled = digit * 2;
      sum += Math.floor(doubled / 10) + (doubled % 10);
    } else {
      sum += digit;
    }
  }

  const controlDigit = (10 - (sum % 10)) % 10;
  const controlLetter = CIF_CONTROL_LETTERS[controlDigit] as string;

  const isLetter = /[A-J]/.test(control);
  if (CIF_LETTER_ONLY.includes(entityType) && !isLetter) {
    return invalid(id, 'Para este tipo de CIF el control debe ser una letra');
  }
  if (CIF_DIGIT_ONLY.includes(entityType) && isLetter) {
    return invalid(id, 'Para este tipo de CIF el control debe ser un dígito');
  }

  const expected = isLetter ? controlLetter : String(controlDigit);
  return control === expected
    ? { valid: true, type: 'CIF', normalized: id }
    : invalid(id, 'El carácter de control del CIF no es correcto');
}

/** Valida un DNI, NIE o CIF español con el algoritmo oficial de control. */
export function validateSpanishTaxId(raw: string): TaxIdResult {
  const id = normalizeTaxId(raw);

  if (DNI_REGEX.test(id)) return validateDni(id);
  if (NIE_REGEX.test(id)) return validateNie(id);
  if (CIF_REGEX.test(id)) return validateCif(id);

  return invalid(id, 'Formato de DNI/NIE/CIF no reconocido');
}

/** Validación de formato genérico para países distintos de España. */
export function validateGenericTaxId(raw: string): TaxIdResult {
  const id = normalizeTaxId(raw);
  return GENERIC_REGEX.test(id)
    ? { valid: true, type: 'OTHER', normalized: id }
    : invalid(id, 'El identificador fiscal debe tener entre 5 y 20 caracteres alfanuméricos');
}

export function validateTaxId(raw: string, country: string): TaxIdResult {
  return country.toUpperCase() === 'ES' ? validateSpanishTaxId(raw) : validateGenericTaxId(raw);
}
