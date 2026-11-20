import { CUSTOMER_SEARCH_LIMIT } from '../config/search.js';
import type { Customer, NewCustomer } from '../domain/customer.js';
import { normalizeTaxId } from '../domain/taxId.js';
import type { Db } from '../db/connection.js';
import { foldText } from '../db/functions.js';
import { DuplicateTaxIdError, isUniqueViolation } from './errors.js';
import { mapCustomerRow, type CustomerRow } from './mappers.js';

const COLUMNS = 'id, company_name, tax_id, contact_email, country, plan, created_at';
/** fold() está registrada en openDatabase: minúsculas y sin tildes, para que «Álvarez» ordene con la A. */
const ORDER = 'ORDER BY fold(company_name), id';

/** Escapa los comodines de LIKE para que el texto se busque de forma literal. */
function toContainsPattern(text: string): string {
  return `%${text.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
}

export function createCustomerRepository(db: Db, searchLimit: number = CUSTOMER_SEARCH_LIMIT) {
  const insert = db.prepare<NewCustomer, CustomerRow>(
    `INSERT INTO customers (company_name, tax_id, contact_email, country, plan)
     VALUES (@companyName, @taxId, @contactEmail, @country, @plan)
     RETURNING ${COLUMNS}`,
  );
  const selectById = db.prepare<[number], CustomerRow>(`SELECT ${COLUMNS} FROM customers WHERE id = ?`);
  const selectAll = db.prepare<[number], CustomerRow>(`SELECT ${COLUMNS} FROM customers ${ORDER} LIMIT ?`);
  const selectMatching = db.prepare<{ name: string; taxId: string | null; limit: number }, CustomerRow>(
    `SELECT ${COLUMNS} FROM customers
     WHERE fold(company_name) LIKE @name ESCAPE '\\' OR tax_id LIKE @taxId ESCAPE '\\'
     ${ORDER} LIMIT @limit`,
  );

  return {
    /** Lanza DuplicateTaxIdError si el identificador fiscal ya existe. */
    create(customer: NewCustomer): Customer {
      try {
        // Con RETURNING, un INSERT que no lanza error siempre devuelve la fila insertada.
        return mapCustomerRow(insert.get(customer) as CustomerRow);
      } catch (error) {
        if (isUniqueViolation(error)) throw new DuplicateTaxIdError(customer.taxId);
        throw error;
      }
    },

    findById(id: number): Customer | undefined {
      const row = selectById.get(id);
      return row ? mapCustomerRow(row) : undefined;
    },

    /** Búsqueda parcial sin distinguir mayúsculas ni tildes en el nombre, o por identificador fiscal normalizado. */
    search(text?: string): Customer[] {
      const query = text?.trim() ?? '';
      if (query === '') return selectAll.all(searchLimit).map(mapCustomerRow);

      const normalizedTaxId = normalizeTaxId(query);
      const rows = selectMatching.all({
        name: toContainsPattern(foldText(query)),
        taxId: normalizedTaxId === '' ? null : toContainsPattern(normalizedTaxId),
        limit: searchLimit,
      });
      return rows.map(mapCustomerRow);
    },
  };
}

export type CustomerRepository = ReturnType<typeof createCustomerRepository>;
