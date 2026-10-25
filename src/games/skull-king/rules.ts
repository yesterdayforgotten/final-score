export type Scoring = 'classic' | 'rascal';

export interface SkOptions {
  scoring: Scoring;
  /** Cards dealt in the first round. */
  startCards: number;
  /** Cards dealt in the last round. */
  endCards: number;
  /** Older games stored only a round count (always starting at 1 card). */
  rounds?: number;
}

export interface SkBonus {
  /** Standard-suit 14s captured, +10 each. */
  std14: number;
  /** Black 14 (Jolly Roger) captured, +20. */
  black14: boolean;
  /** Mermaids captured with a pirate, +20 each. */
  mermaids: number;
  /** Pirates captured with the Skull King, +30 each. */
  pirates: number;
  /** Skull King captured with a mermaid, +40. */
  skullKing: boolean;
  /** Loot alliances where both players made their bid, +20 each. */
  loot: number;
}

export interface SkEntry {
  bid: number | null;
  tricks: number | null;
  bonus: SkBonus;
  /** Rascal only: declared Cannonball instead of Grapeshot. */
  cannonball: boolean;
}

export const MAX_CARDS = 10;

export const defaultOptions = (): SkOptions => ({ scoring: 'classic', startCards: 1, endCards: 10 });

export const emptyBonus = (): SkBonus => ({ std14: 0, black14: false, mermaids: 0, pirates: 0, skullKing: false, loot: 0 });

export const emptyEntry = (): SkEntry => ({ bid: null, tricks: null, bonus: emptyBonus(), cannonball: false });

export const firstCards = (o: SkOptions) => o.startCards ?? 1;
export const lastCards = (o: SkOptions) => o.endCards ?? o.rounds ?? MAX_CARDS;
export const roundCount = (o: SkOptions) => lastCards(o) - firstCards(o) + 1;

/** Cards dealt in 0-based round `index`: one more each round from the starting count. */
export const cardsDealt = (index: number, o: SkOptions) => firstCards(o) + index;

export function bonusPoints(b: SkBonus): number {
  return b.std14 * 10 + (b.black14 ? 20 : 0) + b.mermaids * 20 + b.pirates * 30 + (b.skullKing ? 40 : 0) + b.loot * 20;
}

export function hasBonus(b: SkBonus): boolean {
  return bonusPoints(b) > 0;
}

/**
 * Whether bonuses count for this entry. Classic and Cannonball: exact bid only.
 * Rascal Grapeshot: exact or off by one (halved with the base score).
 */
export function bonusCounts(e: SkEntry, options: SkOptions): boolean {
  if (e.bid === null || e.tricks === null) return false;
  const diff = Math.abs(e.tricks - e.bid);
  if (options.scoring === 'rascal' && !e.cannonball) return diff <= 1;
  return diff === 0;
}

export function score(e: SkEntry, index: number, options: SkOptions): number | null {
  if (e.bid === null || e.tricks === null) return null;
  const n = cardsDealt(index, options);
  const diff = Math.abs(e.tricks - e.bid);
  const bonus = bonusPoints(e.bonus);

  if (options.scoring === 'rascal') {
    if (e.cannonball) return diff === 0 ? 15 * n + bonus : 0;
    const full = 10 * n + bonus;
    if (diff === 0) return full;
    if (diff === 1) return full / 2;
    return 0;
  }

  if (e.bid === 0) return diff === 0 ? 10 * n + bonus : -10 * n;
  return diff === 0 ? 20 * e.bid + bonus : -10 * diff;
}
