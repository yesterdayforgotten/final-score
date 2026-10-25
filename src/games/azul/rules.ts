import type { Game, Round } from '../types';

export type AzulOptions = Record<string, never>;

/** One player's round. Wall mode: tap the tiles placed; number mode: type the round's points. */
export interface AzulEntry {
  mode: 'wall' | 'number';
  /** Wall cells (row * 5 + col) filled this round. At most one per row. */
  placed: number[];
  /** Tiles on the floor line (the first-player marker counts), 0–7. */
  floor: number;
  /** Number mode: the round's points. */
  manual: number | null;
  /** Number mode: this player completed a horizontal row (ends the game after this round). */
  rowDone: boolean;
  /** Number mode, final round: end-of-game bonuses. */
  bonusRows: number;
  bonusCols: number;
  bonusColors: number;
  /** Derived by recompute(): this round's points (placement + floor), and the end bonus if the game ended. */
  points: number;
  bonus: number;
}

export const SIZE = 5;
export const FLOOR_PENALTY = [0, -1, -2, -4, -6, -8, -11, -14];
export const COLORS = ['blue', 'yellow', 'red', 'black', 'teal'] as const;

/** Standard wall: each row shifts the colour pattern one to the right. */
export const colorAt = (cell: number) => COLORS[((cell % SIZE) - Math.floor(cell / SIZE) + SIZE) % SIZE];

export const defaultOptions = (): AzulOptions => ({});
export const emptyEntry = (): AzulEntry => ({
  mode: 'wall', placed: [], floor: 0, manual: null, rowDone: false,
  bonusRows: 0, bonusCols: 0, bonusColors: 0, points: 0, bonus: 0,
});

/** Points for laying `cell` on a wall that already holds `wall`: linked tiles in its row and column. */
export function placePoints(wall: Set<number>, cell: number): number {
  const r = Math.floor(cell / SIZE);
  const c = cell % SIZE;
  const run = (dr: number, dc: number) => {
    let n = 0;
    for (let rr = r + dr, cc = c + dc; rr >= 0 && rr < SIZE && cc >= 0 && cc < SIZE && wall.has(rr * SIZE + cc); rr += dr, cc += dc) n++;
    return n;
  };
  const h = run(0, -1) + run(0, 1);
  const v = run(-1, 0) + run(1, 0);
  if (!h && !v) return 1;
  return (h ? h + 1 : 0) + (v ? v + 1 : 0);
}

/** Lay this round's tiles top to bottom; returns the points and the wall afterwards. */
export function layTiles(before: Set<number>, placed: number[]): { points: number; wall: Set<number> } {
  const wall = new Set(before);
  let points = 0;
  for (const cell of [...placed].sort((a, b) => a - b)) {
    if (wall.has(cell)) continue;
    points += placePoints(wall, cell);
    wall.add(cell);
  }
  return { points, wall };
}

export const floorPenalty = (n: number) => FLOOR_PENALTY[Math.max(0, Math.min(7, n))];

export const hasFullRow = (wall: Set<number>) =>
  Array.from({ length: SIZE }, (_, r) => r).some((r) => Array.from({ length: SIZE }, (_, c) => wall.has(r * SIZE + c)).every(Boolean));

/** End-of-game bonuses: +2 per full row, +7 per full column, +10 per colour with all five tiles. */
export function endBonus(wall: Set<number>): { rows: number; cols: number; colors: number; total: number } {
  const idx = Array.from({ length: SIZE }, (_, i) => i);
  const rows = idx.filter((r) => idx.every((c) => wall.has(r * SIZE + c))).length;
  const cols = idx.filter((c) => idx.every((r) => wall.has(r * SIZE + c))).length;
  const colors = COLORS.filter((col) => [...wall].filter((cell) => colorAt(cell) === col).length === SIZE).length;
  return { rows, cols, colors, total: rows * 2 + cols * 7 + colors * 10 };
}

export const manualBonus = (e: AzulEntry) => e.bonusRows * 2 + e.bonusCols * 7 + e.bonusColors * 10;

/** Each player's wall before round `index` (wall-mode rounds only). */
export function wallBefore(rounds: Round<AzulEntry>[], pid: string, index: number): Set<number> {
  const wall = new Set<number>();
  for (const r of [...rounds].sort((a, b) => a.index - b.index)) {
    if (r.index >= index) break;
    const e = r.entries[pid];
    if (e?.mode === 'wall') for (const c of e.placed) wall.add(c);
  }
  return wall;
}

/** Did round `r` trigger the end (someone finished a row)? */
export function endsGame(game: Game<AzulOptions>, rounds: Round<AzulEntry>[], r: Round<AzulEntry>): boolean {
  return game.playerIds.some((pid) => {
    const e = r.entries[pid];
    if (!e) return false;
    if (e.mode === 'number') return e.rowDone;
    return hasFullRow(layTiles(wallBefore(rounds, pid, r.index), e.placed).wall);
  });
}

/** Refresh every round's derived points and the final-round bonus. */
export function recompute(game: Game<AzulOptions>, rounds: Round<AzulEntry>[]) {
  const sorted = [...rounds].sort((a, b) => a.index - b.index);
  const walls = new Map(game.playerIds.map((pid) => [pid, new Set<number>()]));
  let ended = false;
  for (const r of sorted) {
    const isFinal = !ended && endsGame(game, rounds, r);
    for (const pid of game.playerIds) {
      const e = r.entries[pid];
      if (!e) continue;
      const before = walls.get(pid)!;
      if (e.mode === 'wall') {
        const { points, wall } = layTiles(before, e.placed);
        e.points = points + floorPenalty(e.floor);
        walls.set(pid, wall);
        e.bonus = isFinal ? endBonus(wall).total : 0;
      } else {
        e.points = e.manual ?? 0;
        e.bonus = isFinal ? manualBonus(e) : 0;
      }
    }
    if (isFinal) ended = true;
  }
}

export const score = (e: AzulEntry) => e.points + e.bonus;

/** Azul scores never drop below zero. */
export const accumulate = (total: number, s: number) => Math.max(0, total + s);
