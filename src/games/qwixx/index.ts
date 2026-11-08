import type { GameDefinition } from '../types';
import Art from './Art.svelte';
import Options from './Options.svelte';
import RoundEntry from './RoundEntry.svelte';
import { COLORS, crosses, defaultOptions, emptyEntry, score, type QwixxEntry, type QwixxOptions } from './rules';

/** One scoresheet per player for the whole game: a single "round" that ends when the game does. */
export const qwixx: GameDefinition<QwixxOptions, QwixxEntry> = {
  id: 'qwixx',
  name: 'Qwixx',
  theme: 't-qwixx',
  themeColor: { light: '#2b2e3a', dark: '#16181f' },
  titleFont: 'var(--f-ui)',
  defaultOptions,
  emptyEntry,
  firstData: () => ({ done: false }),
  score: (e) => score(e),
  roundComplete: (round) => round.data?.done === true,
  isOver: (_game, completed) => completed >= 1,
  roundLabel: () => 'Scoresheet',
  optionsTag: () => 'Qwixx',
  cellDetail: (e) => COLORS.map((c) => crosses(e, c)).join('/') + (e.penalties ? ` −${e.penalties * 5}` : ''),
  progress: () => ({ kind: 'open' }),
  RoundEntry,
  Options,
  Art,
  minPlayers: 1,
  maxPlayers: 5,
};
