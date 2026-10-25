import { describe, expect, it } from 'vitest';
import { countPoints, isOver, score } from '../src/games/heat/rules';

describe('beat the heat', () => {
  it('adds up counted cards by their printed points', () => {
    expect(countPoints({ 1: 3, 2: 1, 5: 1, 7: 1 })).toBe(17);
  });

  it('prefers counted cards over a typed number', () => {
    expect(score({ value: 99, cards: { 3: 2 } })).toBe(6);
    expect(score({ value: 4, cards: null })).toBe(4);
    expect(score({ value: null, cards: null })).toBeNull();
  });

  it('ends once anyone reaches the target', () => {
    expect(isOver({ target: 66 }, { a: 65, b: 10 })).toBe(false);
    expect(isOver({ target: 66 }, { a: 66, b: 10 })).toBe(true);
  });
});
