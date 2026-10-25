import { describe, expect, it } from 'vitest';
import { colorAt, emptyEntry, endBonus, floorPenalty, layTiles, placePoints, recompute, score, type AzulEntry } from '../src/games/azul/rules';
import { totals } from '../src/lib/engine';
import { azul } from '../src/games/azul';
import type { Game, Round } from '../src/games/types';

const cell = (r: number, c: number) => r * 5 + c;

describe('azul wall', () => {
  it('lays the standard colour pattern', () => {
    expect(colorAt(cell(0, 0))).toBe('blue');
    expect(colorAt(cell(1, 1))).toBe('blue');
    expect(colorAt(cell(1, 0))).toBe('teal');
    expect(colorAt(cell(0, 4))).toBe('teal');
  });

  it('scores a lone tile as 1', () => {
    expect(placePoints(new Set(), cell(2, 2))).toBe(1);
  });

  it('scores a horizontal run', () => {
    expect(placePoints(new Set([cell(0, 0), cell(0, 1)]), cell(0, 2))).toBe(3);
  });

  it('scores both directions when a tile links a row and a column', () => {
    // row: (2,1)(2,2)+new(2,3) = 3; column: (1,3)+new = 2
    expect(placePoints(new Set([cell(2, 1), cell(2, 2), cell(1, 3)]), cell(2, 3))).toBe(5);
  });

  it('lays tiles top to bottom so earlier ones count', () => {
    // (0,0) alone = 1, then (1,0) links to it vertically = 2
    expect(layTiles(new Set(), [cell(1, 0), cell(0, 0)]).points).toBe(3);
  });

  it('applies floor penalties', () => {
    expect([0, 1, 2, 3, 7].map(floorPenalty)).toEqual([0, -1, -2, -4, -14]);
  });

  it('adds end bonuses for rows, columns and colours', () => {
    const wall = new Set<number>();
    for (let c = 0; c < 5; c++) wall.add(cell(0, c)); // a row
    for (let r = 0; r < 5; r++) wall.add(cell(r, 0)); // a column
    for (let r = 0; r < 5; r++) wall.add(cell(r, r)); // all five blues
    expect(endBonus(wall)).toEqual({ rows: 1, cols: 1, colors: 1, total: 19 });
  });
});

describe('azul game', () => {
  const game: Game = { id: 'g', gameType: 'azul', playerIds: ['a', 'b'], options: {}, status: 'active', createdAt: 0, updatedAt: 0 };
  const round = (index: number, a: Partial<AzulEntry>, b: Partial<AzulEntry>): Round<AzulEntry> => ({
    id: `g:${index}`, gameId: 'g', index, updatedAt: 0, data: { done: true },
    entries: { a: { ...emptyEntry(), ...a }, b: { ...emptyEntry(), ...b } },
  });

  it('never lets a total drop below zero', () => {
    const rs = [round(0, { floor: 3 }, { placed: [cell(0, 0)] })];
    recompute(game, rs);
    expect(score(rs[0].entries.a)).toBe(-4);
    expect(totals(azul, game, rs)).toEqual({ a: 0, b: 1 });
  });

  it('adds the end bonus in the round someone completes a row', () => {
    const rs = [0, 1, 2, 3, 4].map((i) => round(i, { placed: [cell(0, i)] }, { mode: 'number', manual: 2 }));
    recompute(game, rs);
    expect(rs[3].entries.a.bonus).toBe(0);
    expect(rs[4].entries.a.bonus).toBe(2); // one full row
    expect(totals(azul, game, rs).a).toBe(1 + 2 + 3 + 4 + 5 + 2);
  });

  it('ends the game when a number-mode player reports a finished row', () => {
    const rs = [round(0, {}, { mode: 'number', manual: 10, rowDone: true, bonusRows: 1, bonusCols: 1 })];
    recompute(game, rs);
    expect(rs[0].entries.b.bonus).toBe(9);
    expect(azul.isOver(game, 1, {}, rs)).toBe(true);
  });
});
