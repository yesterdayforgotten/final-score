import type { Game, GameDefinition, Round } from '../games/types';

/** Totals by player id, summing rounds with index < `before` (all rounds when omitted). */
export function totals(def: GameDefinition, game: Game, rounds: Round[], before = Infinity): Record<string, number> {
  const t: Record<string, number> = Object.fromEntries(game.playerIds.map((id) => [id, 0]));
  for (const r of rounds) {
    if (r.index >= before) continue;
    for (const id of game.playerIds) {
      const e = r.entries[id];
      if (e === undefined) continue;
      t[id] += def.score(e, r.index, game.options) ?? 0;
    }
  }
  return t;
}

/** Player ids with the highest total (more than one on a tie). */
export function leaders(t: Record<string, number>): string[] {
  const vals = Object.values(t);
  if (!vals.length) return [];
  const max = Math.max(...vals);
  if (vals.every((v) => v === max) && vals.length > 1 && max === 0) return [];
  return Object.keys(t).filter((id) => t[id] === max);
}

/** Seat index of the dealer for a 0-based round. */
export const dealerSeat = (roundIndex: number, players: number) => roundIndex % players;

/** Players ordered by total, highest first; ties keep seat order. */
export function standings(game: Game, t: Record<string, number>): string[] {
  return [...game.playerIds].sort((a, b) => t[b] - t[a] || game.playerIds.indexOf(a) - game.playerIds.indexOf(b));
}

/** Number of rounds that are complete, counting from the first. */
export function completedRounds(def: GameDefinition, game: Game, rounds: Round[]): number {
  let n = 0;
  for (const r of [...rounds].sort((a, b) => a.index - b.index)) {
    if (r.index !== n || !def.roundComplete(r, game)) break;
    n++;
  }
  return n;
}
