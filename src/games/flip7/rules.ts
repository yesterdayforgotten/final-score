export interface F7Options {
  target: number;
}

export interface F7Hand {
  /** Distinct number cards 0–12. */
  numbers: number[];
  /** Plus modifiers: 2, 4, 6, 8, 10. */
  mods: number[];
  x2: boolean;
}

export interface F7Entry {
  /** Typed score; ignored when `hand` is set or `bust` is true. */
  value: number | null;
  bust: boolean;
  hand: F7Hand | null;
}

export const NUMBERS = Array.from({ length: 13 }, (_, i) => i);
export const MODS = [2, 4, 6, 8, 10];
export const FLIP7_BONUS = 15;

export const defaultOptions = (): F7Options => ({ target: 200 });

export const emptyEntry = (): F7Entry => ({ value: null, bust: false, hand: null });

export const emptyHand = (): F7Hand => ({ numbers: [], mods: [], x2: false });

export const isFlip7 = (h: F7Hand) => new Set(h.numbers).size === 7;

/** Number cards summed, doubled by x2, then modifiers added, then +15 for seven numbers. */
export function handScore(h: F7Hand): number {
  const nums = h.numbers.reduce((a, b) => a + b, 0);
  const mods = h.mods.reduce((a, b) => a + b, 0);
  return nums * (h.x2 ? 2 : 1) + mods + (isFlip7(h) ? FLIP7_BONUS : 0);
}

export function score(e: F7Entry): number | null {
  if (e.bust) return 0;
  if (e.hand) return handScore(e.hand);
  return e.value;
}
