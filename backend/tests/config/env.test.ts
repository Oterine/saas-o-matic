import { describe, expect, it } from 'vitest';
import { loadEnv } from '../../src/config/env.js';

describe('loadEnv', () => {
  it('usa los valores por defecto si no hay variables', () => {
    expect(loadEnv({})).toEqual({ PORT: 3000, DB_PATH: './data/saas-o-matic.db' });
  });

  it('acepta valores personalizados y convierte el puerto a número', () => {
    expect(loadEnv({ PORT: '8080', DB_PATH: ':memory:' })).toEqual({ PORT: 8080, DB_PATH: ':memory:' });
  });

  it('ignora variables que no le conciernen', () => {
    expect(loadEnv({ PATH: '/usr/bin', HOME: '/home/x' })).toEqual({
      PORT: 3000,
      DB_PATH: './data/saas-o-matic.db',
    });
  });

  it.each(['abc', '0', '70000', '3000.5'])('rechaza PORT inválido (%s)', (port) => {
    expect(() => loadEnv({ PORT: port })).toThrow(/Configuración de entorno inválida: PORT/);
  });

  it('rechaza DB_PATH vacío', () => {
    expect(() => loadEnv({ DB_PATH: '   ' })).toThrow(/DB_PATH/);
  });
});
