import type { Game, Round } from '../types';

export interface HerdOptions {
  /** Cows needed to win. */
  target: number;
  /** Show a question from the app each round. */
  questions: boolean;
}

export interface HerdEntry {
  /** Gave the majority answer: one cow. */
  herd: boolean;
  /** The only player with a unique answer: takes the pink cow. */
  odd: boolean;
}

export interface HerdRound {
  question: string | null;
  done: boolean;
}

export const defaultOptions = (): HerdOptions => ({ target: 8, questions: true });
export const emptyEntry = (): HerdEntry => ({ herd: false, odd: false });
export const emptyRound = (): HerdRound => ({ question: null, done: false });

export const score = (e: HerdEntry): number => (e.herd ? 1 : 0);

/**
 * Who holds the pink cow after the given rounds: it moves to whoever was the odd one out most recently.
 */
export function pinkHolder(rounds: Round<HerdEntry>[], upTo = Infinity): string | null {
  let holder: string | null = null;
  for (const r of [...rounds].sort((a, b) => a.index - b.index)) {
    if (r.index > upTo) break;
    for (const [pid, e] of Object.entries(r.entries)) if (e.odd) holder = pid;
  }
  return holder;
}

/** Players who've reached the target and don't hold the pink cow, highest first. */
export function winners(game: Game<HerdOptions>, rounds: Round<HerdEntry>[], totals: Record<string, number>): string[] {
  const pink = pinkHolder(rounds);
  const eligible = game.playerIds.filter((id) => id !== pink && totals[id] >= game.options.target);
  if (!eligible.length) {
    // Ended early: best total among players without the pink cow.
    const pool = game.playerIds.filter((id) => id !== pink);
    const best = Math.max(...pool.map((id) => totals[id] ?? 0));
    return best > 0 ? pool.filter((id) => totals[id] === best) : [];
  }
  const best = Math.max(...eligible.map((id) => totals[id]));
  return eligible.filter((id) => totals[id] === best);
}

export function isOver(game: Game<HerdOptions>, totals: Record<string, number>, rounds: Round<HerdEntry>[]): boolean {
  const pink = pinkHolder(rounds);
  return game.playerIds.some((id) => id !== pink && totals[id] >= game.options.target);
}
