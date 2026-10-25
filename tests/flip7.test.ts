import { describe, expect, it } from 'vitest';
import { handScore, isFlip7, score } from '../src/games/flip7/rules';

describe('flip 7 hand scoring', () => {
  it('sums number cards and adds modifiers', () => {
    expect(handScore({ numbers: [2, 4, 5, 7, 11], mods: [4], x2: false })).toBe(33);
  });

  it('doubles only the number cards with x2', () => {
    expect(handScore({ numbers: [10, 12], mods: [4], x2: true })).toBe(48);
  });

  it('adds 15 for seven distinct numbers', () => {
    const h = { numbers: [0, 1, 3, 5, 6, 8, 9], mods: [], x2: false };
    expect(isFlip7(h)).toBe(true);
    expect(handScore(h)).toBe(47);
  });

  it('applies the Flip 7 bonus after doubling', () => {
    // (1+2+3+4+5+6+7) * 2 + 10 + 15
    expect(handScore({ numbers: [1, 2, 3, 4, 5, 6, 7], mods: [10], x2: true })).toBe(81);
  });
});

describe('flip 7 entry', () => {
  it('is null until something is entered', () => {
    expect(score({ value: null, bust: false, hand: null })).toBeNull();
  });

  it('uses the typed value', () => {
    expect(score({ value: 34, bust: false, hand: null })).toBe(34);
  });

  it('scores a bust as zero, whatever else is set', () => {
    expect(score({ value: 34, bust: true, hand: null })).toBe(0);
  });

  it('prefers the hand over a typed value', () => {
    expect(score({ value: 99, bust: false, hand: { numbers: [3], mods: [], x2: false } })).toBe(3);
  });
});
