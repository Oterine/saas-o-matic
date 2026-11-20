import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { openDatabase, type Db } from '../../src/db/connection.js';
import { foldText } from '../../src/db/functions.js';

describe('foldText', () => {
  it.each([
    ['ÑANDÚ S.L.', 'nandu s.l.'],
    ['Álvarez', 'alvarez'],
    ['Pingüino', 'pinguino'],
    ['Crème Brûlée', 'creme brulee'],
    ['ACME 100%', 'acme 100%'],
  ])('%s → %s', (input, expected) => {
    expect(foldText(input)).toBe(expected);
  });
});

describe('función SQL fold', () => {
  let db: Db;

  beforeEach(() => {
    db = openDatabase(':memory:');
  });

  afterEach(() => {
    db.close();
  });

  it('está registrada en las conexiones de openDatabase', () => {
    expect(db.prepare('SELECT fold(?) AS r').get('Álvarez')).toEqual({ r: 'alvarez' });
  });

  it('deja pasar NULL y valores no textuales', () => {
    expect(db.prepare('SELECT fold(NULL) AS a, fold(42) AS b').get()).toEqual({ a: null, b: 42 });
  });
});
