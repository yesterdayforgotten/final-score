import { flip7 } from './flip7';
import { skullKing } from './skull-king';
import type { GameDefinition } from './types';

/** Every game the app knows. Add new games here. */
export const GAMES: GameDefinition[] = [skullKing, flip7];

export const gameById = (id: string): GameDefinition | undefined => GAMES.find((g) => g.id === id);
