import { anyGame } from './any';
import { azul } from './azul';
import { bank } from './bank';
import { flip7 } from './flip7';
import { beatTheHeat } from './heat';
import { herd } from './herd';
import { qwixx } from './qwixx';
import { skullKing } from './skull-king';
import type { GameDefinition } from './types';

/** Every game the app knows. Add new games here. */
export const GAMES: GameDefinition[] = [skullKing, flip7, bank, herd, azul, beatTheHeat, qwixx, anyGame];

export const gameById = (id: string): GameDefinition | undefined => GAMES.find((g) => g.id === id);
