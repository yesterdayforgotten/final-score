export type Color = 'red' | 'yellow' | 'green' | 'blue';
export const COLORS: Color[] = ['red', 'yellow', 'green', 'blue'];

export type QwixxOptions = Record<string, never>;

export interface QwixxEntry {
  /** 'sheet': tap numbers on a digital scoresheet; 'counts': enter crosses per row. */
  mode: 'sheet' | 'counts';
  /** Sheet mode: crossed cells per row, as positions 0–10 (left to right on the printed sheet). */
  marks: Record<Color, number[]>;
  /** Counts mode: crosses per row, not counting a lock. */
  counts: Record<Color, number>;
  /** Counts mode: rows this player locked. */
  locked: Record<Color, boolean>;
  penalties: number;
}

export const LAST = 10;
export const MIN_TO_LOCK = 5;
export const MAX_PENALTIES = 4;
export const PENALTY = 5;

/** Numbers along a row: red and yellow run 2–12, green and blue 12–2. */
export const rowNumbers = (c: Color) => {
  const up = Array.from({ length: 11 }, (_, i) => i + 2);
  return c === 'red' || c === 'yellow' ? up : up.reverse();
};

const perColor = <T,>(f: () => T) => Object.fromEntries(COLORS.map((c) => [c, f()])) as Record<Color, T>;

export const defaultOptions = (): QwixxOptions => ({});
export const emptyEntry = (): QwixxEntry => ({
  mode: 'sheet',
  marks: perColor(() => [] as number[]),
  counts: perColor(() => 0),
  locked: perColor(() => false),
  penalties: 0,
});

/** Points for n crosses in a row: 1, 3, 6, 10, 15 … (n·(n+1)/2). */
export const rowPoints = (n: number) => (n * (n + 1)) / 2;

/** Did this player lock row c? */
export const lockedBy = (e: QwixxEntry, c: Color) => (e.mode === 'sheet' ? e.marks[c].includes(LAST) : e.locked[c]);

/** Crosses counted for scoring in row c (a lock adds one more). */
export function crosses(e: QwixxEntry, c: Color): number {
  const base = e.mode === 'sheet' ? e.marks[c].length : e.counts[c];
  return base + (lockedBy(e, c) ? 1 : 0);
}

export const rowScore = (e: QwixxEntry, c: Color) => rowPoints(crosses(e, c));

export const score = (e: QwixxEntry) => COLORS.reduce((a, c) => a + rowScore(e, c), 0) - PENALTY * e.penalties;

/** Rows locked by anyone at the table. */
export const lockedRows = (entries: QwixxEntry[]) => COLORS.filter((c) => entries.some((e) => lockedBy(e, c)));

/** The game ends once two rows are locked or anyone has taken all four penalties. */
export const gameOver = (entries: QwixxEntry[]) => lockedRows(entries).length >= 2 || entries.some((e) => e.penalties >= MAX_PENALTIES);

/** Can position `pos` be crossed in row c? Left to right only, the last number needs 5 crosses, and not once the row is locked. */
export function canMark(e: QwixxEntry, c: Color, pos: number, rowLocked: boolean): boolean {
  if (rowLocked && !e.marks[c].includes(LAST)) return false;
  const last = e.marks[c].length ? Math.max(...e.marks[c]) : -1;
  if (pos <= last) return false;
  if (pos === LAST) return e.marks[c].length >= MIN_TO_LOCK;
  return true;
}
