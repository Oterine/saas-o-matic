/** Contratos de la API (spec §6). Todos los importes en céntimos de EUR. */

export type Plan = 'starter' | 'business' | 'enterprise';

export interface NewCustomer {
  companyName: string;
  taxId: string;
  contactEmail: string;
  country: string;
  plan: Plan;
}

export interface Customer extends NewCustomer {
  id: number;
  /** ISO 8601 en UTC. */
  createdAt: string;
}

export interface NewSimulation {
  customerId: number;
  activeUsers: number;
  storageGb: number;
  apiCalls: number;
}

export interface PricingPreview {
  activeUsers: number;
  baseCents: number;
  /** Fracción: 0.21 = 21 %. */
  taxRate: number;
  taxCents: number;
  totalCents: number;
  currency: 'EUR';
}

export interface Simulation extends NewSimulation, PricingPreview {
  id: number;
  /** ISO 8601 en UTC. */
  createdAt: string;
}

export interface Country {
  /** ISO-2. */
  code: string;
  taxRate: number;
}

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'DUPLICATE_TAX_ID'
  | 'INTERNAL_ERROR'
  | 'NETWORK_ERROR'
  | 'UNEXPECTED_RESPONSE';

/** Mensajes por campo. La clave `_` agrupa los errores que afectan a toda la petición. */
export type FieldErrors = Record<string, string>;
