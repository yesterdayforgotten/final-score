import { describe, expect, it } from 'vitest';
import { canMark, emptyEntry, gameOver, rowNumbers, rowPoints, score, type QwixxEntry } from '../src/games/qwixx/rules';

const sheet = (marks: Partial<QwixxEntry['marks']>, penalties = 0): QwixxEntry => ({ ...emptyEntry(), marks: { ...emptyEntry().marks, ...marks }, penalties });

describe('qwixx', () => {
  it('lays out the rows', () => {
    expect(rowNumbers('red')[0]).toBe(2);
    expect(rowNumbers('green')[0]).toBe(12);
  });

  it('scores crosses as triangular numbers', () => {
    expect([1, 2, 3, 4, 5, 12].map(rowPoints)).toEqual([1, 3, 6, 10, 15, 78]);
  });

  it('adds up rows and takes 5 per penalty', () => {
    // red 3 crosses = 6, blue 2 = 3, two penalties = −10
    expect(score(sheet({ red: [0, 2, 5], blue: [1, 4] }, 2))).toBe(-1);
  });

  it('counts a lock as an extra cross', () => {
    // 5 crosses + the last number + the lock = 7 → 28
    expect(score(sheet({ yellow: [0, 1, 2, 3, 4, 10] }))).toBe(28);
  });

  it('only allows crossing left to right, and locking after five crosses', () => {
    const e = sheet({ red: [3] });
    expect(canMark(e, 'red', 2, false)).toBe(false);
    expect(canMark(e, 'red', 4, false)).toBe(true);
    expect(canMark(e, 'red', 10, false)).toBe(false);
    expect(canMark(sheet({ red: [0, 1, 2, 3, 4] }), 'red', 10, false)).toBe(true);
    expect(canMark(e, 'red', 4, true)).toBe(false);
  });

  it('works out crosses in counts mode', () => {
    const e = { ...emptyEntry(), mode: 'counts' as const, counts: { red: 6, yellow: 0, green: 2, blue: 0 }, locked: { red: true, yellow: false, green: false, blue: false } };
    expect(score(e)).toBe(28 + 3);
  });

  it('ends with two locked rows or four penalties', () => {
    expect(gameOver([sheet({ red: [0, 1, 2, 3, 4, 10] }), sheet({})])).toBe(false);
    expect(gameOver([sheet({ red: [0, 1, 2, 3, 4, 10] }), sheet({ blue: [0, 1, 2, 3, 4, 10] })])).toBe(true);
    expect(gameOver([sheet({}, 4)])).toBe(true);
  });
});
