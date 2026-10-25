import Dexie, { type EntityTable } from 'dexie';
import type { Game, Player, Round } from '../games/types';

export const PLAYER_COLORS = 8;

class ScoreDB extends Dexie {
  players!: EntityTable<Player, 'id'>;
  games!: EntityTable<Game, 'id'>;
  rounds!: EntityTable<Round, 'id'>;

  constructor(name = 'final-score') {
    super(name);
    this.version(1).stores({
      players: 'id, &nameKey, lastUsedAt',
      games: 'id, gameType, status, [gameType+createdAt], updatedAt',
      rounds: 'id, gameId, [gameId+index]',
    });
  }
}

export let db = new ScoreDB();

/** Tests only: switch to a fresh database. */
export function useDatabase(name: string) {
  db = new ScoreDB(name);
}

export const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).slice(2);

export const nameKey = (name: string) => name.trim().replace(/\s+/g, ' ').toLowerCase();

export const cleanName = (name: string) => name.trim().replace(/\s+/g, ' ');

/** Least-used colour, lowest index on a tie. */
async function nextColor(): Promise<number> {
  const counts = new Array(PLAYER_COLORS).fill(0);
  await db.players.each((p) => counts[p.color % PLAYER_COLORS]++);
  return counts.indexOf(Math.min(...counts));
}

export async function findOrCreatePlayer(name: string): Promise<Player> {
  const key = nameKey(name);
  if (!key) throw new Error('Player name is empty');
  return db.transaction('rw', db.players, async () => {
    const existing = await db.players.where('nameKey').equals(key).first();
    if (existing) return existing;
    const p: Player = { id: uid(), name: cleanName(name), nameKey: key, color: await nextColor(), lastUsedAt: 0, timesPlayed: 0 };
    await db.players.add(p);
    return p;
  });
}

export async function getPlayers(ids: string[]): Promise<Player[]> {
  const found = await db.players.bulkGet(ids);
  return found.filter((p): p is Player => !!p);
}

/** Last time each player took part in a game of this type. */
async function lastPlayedIn(gameType: string): Promise<Map<string, number>> {
  const m = new Map<string, number>();
  await db.games.where('gameType').equals(gameType).each((g) => {
    for (const id of g.playerIds) m.set(id, Math.max(m.get(id) ?? 0, g.createdAt));
  });
  return m;
}

export interface Suggestion {
  player: Player;
  /** When they last played this game, or undefined if never. */
  lastHere?: number;
}

/**
 * Players matching `query` (prefix of any word first, then anywhere), people who've played this game first,
 * then most recent overall. An empty query returns recent players.
 */
export async function suggestPlayers(query: string, gameType: string, exclude: string[] = [], limit = 5): Promise<Suggestion[]> {
  const q = nameKey(query);
  const here = await lastPlayedIn(gameType);
  const all = (await db.players.toArray()).filter((p) => !exclude.includes(p.id) && p.timesPlayed > 0);
  const rank = (p: Player) => {
    if (!q) return 0;
    if (p.nameKey.startsWith(q)) return 0;
    if (p.nameKey.split(' ').some((w) => w.startsWith(q))) return 1;
    if (p.nameKey.includes(q)) return 2;
    return -1;
  };
  return all
    .map((p) => ({ p, r: rank(p) }))
    .filter((x) => x.r >= 0 && x.p.nameKey !== q)
    .sort((a, b) => a.r - b.r || (here.get(b.p.id) ?? 0) - (here.get(a.p.id) ?? 0) || b.p.lastUsedAt - a.p.lastUsedAt)
    .slice(0, limit)
    .map(({ p }) => ({ player: p, lastHere: here.get(p.id) }));
}

export async function createGame<O>(gameType: string, playerIds: string[], options: O, firstRound: Omit<Round, 'id' | 'gameId' | 'index' | 'updatedAt'>): Promise<Game<O>> {
  const now = Date.now();
  const game: Game<O> = { id: uid(), gameType, playerIds, options, status: 'active', createdAt: now, updatedAt: now };
  await db.transaction('rw', db.games, db.rounds, db.players, async () => {
    await db.games.add(game as Game);
    await db.rounds.add({ ...firstRound, id: `${game.id}:0`, gameId: game.id, index: 0, updatedAt: now });
    for (const id of playerIds) {
      await db.players.where('id').equals(id).modify((p) => {
        p.lastUsedAt = now;
        p.timesPlayed += 1;
      });
    }
  });
  return game;
}

export const getGame = (id: string) => db.games.get(id);

export const getRounds = (gameId: string) => db.rounds.where('[gameId+index]').between([gameId, Dexie.minKey], [gameId, Dexie.maxKey]).toArray();

export async function saveRound(round: Round) {
  const now = Date.now();
  await db.transaction('rw', db.rounds, db.games, async () => {
    await db.rounds.put({ ...round, updatedAt: now });
    await db.games.update(round.gameId, { updatedAt: now });
  });
}

export async function saveGame(game: Game) {
  await db.games.put({ ...game, updatedAt: Date.now() });
}

export async function deleteRoundsFrom(gameId: string, fromIndex: number) {
  await db.rounds.where('gameId').equals(gameId).and((r) => r.index >= fromIndex).delete();
}

export async function deleteGame(id: string) {
  await db.transaction('rw', db.games, db.rounds, async () => {
    await db.rounds.where('gameId').equals(id).delete();
    await db.games.delete(id);
  });
}

/** Games of one type, newest first. */
export const listGames = (gameType: string) =>
  db.games.where('[gameType+createdAt]').between([gameType, Dexie.minKey], [gameType, Dexie.maxKey]).reverse().toArray();

export const activeGames = () => db.games.where('status').equals('active').reverse().sortBy('updatedAt');

/** Ask the browser not to evict our data under storage pressure. */
export async function requestPersistence() {
  try {
    if (navigator.storage?.persisted && !(await navigator.storage.persisted())) await navigator.storage.persist();
  } catch {
    /* not supported */
  }
}
