export type EndMode = 'open' | 'rounds' | 'target';

export interface AnyOptions {
  /** What the players call this game, e.g. "Uno". */
  title: string;
  end: EndMode;
  rounds: number;
  target: number;
  lowWins: boolean;
}

export interface AnyEntry {
  value: number | null;
}

export const defaultOptions = (): AnyOptions => ({ title: '', end: 'open', rounds: 10, target: 100, lowWins: false });
export const emptyEntry = (): AnyEntry => ({ value: null });
export const score = (e: AnyEntry) => e.value;
export const displayName = (o: AnyOptions) => o.title.trim() || 'Any game';

export function isOver(o: AnyOptions, completed: number, totals: Record<string, number>): boolean {
  if (o.end === 'rounds') return completed >= o.rounds;
  if (o.end === 'target') return Object.values(totals).some((t) => t >= o.target);
  return false;
}
