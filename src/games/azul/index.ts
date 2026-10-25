import type { GameDefinition } from '../types';
import Art from './Art.svelte';
import Options from './Options.svelte';
import RoundEntry from './RoundEntry.svelte';
import { accumulate, defaultOptions, emptyEntry, endsGame, recompute, score, type AzulEntry, type AzulOptions } from './rules';

export const azul: GameDefinition<AzulOptions, AzulEntry> = {
  id: 'azul',
  name: 'Azul',
  theme: 't-azul',
  themeColor: { light: '#1f5fbf', dark: '#0f2a55' },
  titleFont: 'var(--f-azul)',
  defaultOptions,
  emptyEntry,
  firstData: () => ({ done: false }),
  score: (e) => score(e),
  accumulate,
  recompute,
  roundComplete: (round) => round.data?.done === true,
  isOver: (game, _completed, _totals, rounds) => rounds.some((r) => r.data?.done && endsGame(game, rounds, r)),
  roundLabel: (index) => `Round ${index + 1}`,
  optionsTag: () => 'Azul',
  cellDetail: (e) => (e.mode === 'wall' ? `${e.placed.length} tile${e.placed.length === 1 ? '' : 's'}${e.floor ? ` · −${-[0, -1, -2, -4, -6, -8, -11, -14][e.floor]}` : ''}${e.bonus ? ` · +${e.bonus}` : ''}` : e.bonus ? `+${e.bonus} bonus` : ''),
  progress: () => ({ kind: 'open' }),
  RoundEntry,
  Options,
  Art,
  minPlayers: 2,
  maxPlayers: 4,
};
