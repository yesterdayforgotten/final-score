export interface HeatOptions {
  /** The game ends after the round anyone reaches this; lowest total wins. */
  target: number;
}

/** Cards taken this round, counted by the points printed on them. */
export type CardCounts = Record<string, number>;

export interface HeatEntry {
  value: number | null;
  cards: CardCounts | null;
}

/** Point values printed on the cards (as in 6 Nimmt / Take 5). */
export const CARD_VALUES = [1, 2, 3, 5, 7];

export const defaultOptions = (): HeatOptions => ({ target: 66 });
export const emptyEntry = (): HeatEntry => ({ value: null, cards: null });

export const countPoints = (c: CardCounts) => CARD_VALUES.reduce((a, v) => a + v * (c[v] ?? 0), 0);

export function score(e: HeatEntry): number | null {
  if (e.cards) return countPoints(e.cards);
  return e.value;
}

export const isOver = (o: HeatOptions, totals: Record<string, number>) => Object.values(totals).some((t) => t >= o.target);
