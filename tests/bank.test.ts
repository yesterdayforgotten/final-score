import { describe, expect, it } from 'vitest';
import { bankState, rollFromDice, type Roll } from '../src/games/bank/rules';

const r = (sum: number, doubles = false): Roll => ({ sum, doubles });

describe('bank rolls', () => {
  it('adds totals', () => {
    expect(bankState([r(5), r(8), r(4), r(9)]).bank).toBe(26);
  });

  it('makes a 7 worth 70 in the first three rolls', () => {
    expect(bankState([r(7), r(7), r(3)])).toEqual({ bank: 143, sevened: false, count: 3 });
  });

  it('counts doubles at face value in the first three rolls', () => {
    expect(bankState([rollFromDice(5, 5), rollFromDice(2, 2), r(3)]).bank).toBe(17);
  });

  it('doubles the bank on doubles after the first three rolls', () => {
    expect(bankState([r(10), r(10), r(10), rollFromDice(3, 3)]).bank).toBe(60);
    expect(bankState([r(10), r(10), r(10), r(0, true), r(0, true)]).bank).toBe(120);
  });

  it('ends the round and empties the bank on a 7 after the first three', () => {
    const s = bankState([r(8), r(9), r(10), r(6), r(7), r(12)]);
    expect(s).toEqual({ bank: 0, sevened: true, count: 5 });
  });

  it('starts empty', () => {
    expect(bankState([])).toEqual({ bank: 0, sevened: false, count: 0 });
  });
});
