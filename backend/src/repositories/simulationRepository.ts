import type { Db } from '../db/connection.js';
import type { NewSimulation, Simulation } from '../domain/simulation.js';
import { mapSimulationRow, type SimulationRow } from './mappers.js';

const COLUMNS = `id, customer_id, active_users, storage_gb, api_calls,
  base_cents, tax_rate_percent, tax_cents, total_cents, created_at`;

export function createSimulationRepository(db: Db) {
  const insert = db.prepare<NewSimulation, SimulationRow>(
    `INSERT INTO simulations
       (customer_id, active_users, storage_gb, api_calls, base_cents, tax_rate_percent, tax_cents, total_cents)
     VALUES
       (@customerId, @activeUsers, @storageGb, @apiCalls, @baseCents, @taxRatePercent, @taxCents, @totalCents)
     RETURNING ${COLUMNS}`,
  );
  const selectByCustomer = db.prepare<[number], SimulationRow>(
    `SELECT ${COLUMNS} FROM simulations
     WHERE customer_id = ?
     ORDER BY created_at DESC, id DESC`,
  );

  return {
    /** Guarda la simulación tal cual: los importes ya vienen calculados. El cliente debe existir (FK). */
    create(simulation: NewSimulation): Simulation {
      // Con RETURNING, un INSERT que no lanza error siempre devuelve la fila insertada.
      return mapSimulationRow(insert.get(simulation) as SimulationRow);
    },

    /** Historial del cliente, de la más reciente a la más antigua. */
    listByCustomer(customerId: number): Simulation[] {
      return selectByCustomer.all(customerId).map(mapSimulationRow);
    },
  };
}

export type SimulationRepository = ReturnType<typeof createSimulationRepository>;
