import { describe, expect, it } from 'vitest';
import { defaultOptions, displayName, isOver } from '../src/games/any/rules';
import { leaders, standings } from '../src/lib/engine';

describe('any game', () => {
  it('names itself after what the players typed', () => {
    expect(displayName({ ...defaultOptions(), title: '  Uno ' })).toBe('Uno');
    expect(displayName(defaultOptions())).toBe('Any game');
  });

  it('ends after a set number of rounds', () => {
    const o = { ...defaultOptions(), end: 'rounds' as const, rounds: 3 };
    expect(isOver(o, 2, {})).toBe(false);
    expect(isOver(o, 3, {})).toBe(true);
  });

  it('ends when anyone reaches the target, high or low', () => {
    const o = { ...defaultOptions(), end: 'target' as const, target: 100 };
    expect(isOver(o, 5, { a: 99, b: 40 })).toBe(false);
    expect(isOver(o, 5, { a: 104, b: 40 })).toBe(true);
  });

  it('never ends on its own when open-ended', () => {
    expect(isOver(defaultOptions(), 99, { a: 1e6 })).toBe(false);
  });

  it('ranks lowest first when low wins', () => {
    const g = { id: 'g', gameType: 'any', playerIds: ['a', 'b', 'c'], options: {}, status: 'active' as const, createdAt: 0, updatedAt: 0 };
    expect(leaders({ a: 30, b: 12, c: 50 }, true)).toEqual(['b']);
    expect(standings(g, { a: 30, b: 12, c: 50 }, true)).toEqual(['b', 'a', 'c']);
  });
});
