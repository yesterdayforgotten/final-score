import { GAMES } from '../games/registry';
import type { GameDefinition } from '../games/types';

const KEY = 'fs.games';

interface Prefs {
  order: string[];
  hidden: string[];
}

function read(): Prefs {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    if (v && Array.isArray(v.order) && Array.isArray(v.hidden)) return v;
  } catch {
    /* fall through */
  }
  return { order: [], hidden: [] };
}

/** Home-screen order and hidden games, per device. */
export const gamePrefs = $state<Prefs>(read());

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(gamePrefs));
  } catch {
    /* private mode */
  }
}

/** Every game in the chosen order; games added later go at the end in registry order. */
export function orderedGames(): GameDefinition[] {
  const known = gamePrefs.order.map((id) => GAMES.find((g) => g.id === id)).filter((g): g is GameDefinition => !!g);
  return [...known, ...GAMES.filter((g) => !gamePrefs.order.includes(g.id))];
}

export const visibleGames = () => orderedGames().filter((g) => !gamePrefs.hidden.includes(g.id));

export function setOrder(ids: string[]) {
  gamePrefs.order = ids;
  save();
}

export function setHidden(id: string, hidden: boolean) {
  gamePrefs.hidden = hidden ? [...new Set([...gamePrefs.hidden, id])] : gamePrefs.hidden.filter((x) => x !== id);
  save();
}
