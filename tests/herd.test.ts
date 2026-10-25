import { describe, expect, it } from 'vitest';
import { isOver, pinkHolder, winners, type HerdEntry, type HerdOptions } from '../src/games/herd/rules';
import { QUESTIONS } from '../src/games/herd/questions';
import type { Game, Round } from '../src/games/types';

const game = (target = 3): Game<HerdOptions> => ({
  id: 'g', gameType: 'herd', playerIds: ['a', 'b', 'c'], options: { target, questions: true },
  status: 'active', createdAt: 0, updatedAt: 0,
});

function round(index: number, herd: string[], odd?: string): Round<HerdEntry> {
  const entries: Record<string, HerdEntry> = {};
  for (const id of ['a', 'b', 'c']) entries[id] = { herd: herd.includes(id), odd: id === odd };
  return { id: `g:${index}`, gameId: 'g', index, entries, updatedAt: 0, data: { question: null, done: true } };
}

describe('pink cow', () => {
  it('goes to the most recent odd one out', () => {
    const rs = [round(0, ['a', 'b'], 'c'), round(1, ['b', 'c'], 'a'), round(2, ['a', 'c'])];
    expect(pinkHolder(rs)).toBe('a');
    expect(pinkHolder(rs, 0)).toBe('c');
  });

  it('starts with nobody', () => {
    expect(pinkHolder([round(0, ['a', 'b'])])).toBeNull();
  });
});

describe('winning', () => {
  it('ends when someone without the pink cow reaches the target', () => {
    const rs = [round(0, ['a']), round(1, ['a']), round(2, ['a'])];
    expect(isOver(game(), { a: 3, b: 0, c: 0 }, rs)).toBe(true);
    expect(winners(game(), rs, { a: 3, b: 0, c: 0 })).toEqual(['a']);
  });

  it("doesn't end while the leader holds the pink cow", () => {
    const rs = [round(0, ['a']), round(1, ['a']), round(2, ['a'], 'a')];
    expect(isOver(game(), { a: 3, b: 0, c: 0 }, rs)).toBe(false);
  });

  it('picks the best total without the pink cow when ended early', () => {
    const rs = [round(0, ['a', 'b'], 'c'), round(1, ['a'], 'a')];
    expect(winners(game(8), rs, { a: 2, b: 1, c: 0 })).toEqual(['b']);
  });
});

describe('questions', () => {
  it('has a good-sized bank with no duplicates', () => {
    expect(QUESTIONS.length).toBeGreaterThanOrEqual(150);
    expect(new Set(QUESTIONS).size).toBe(QUESTIONS.length);
  });
});
