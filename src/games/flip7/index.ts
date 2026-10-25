import type { GameDefinition } from '../types';
import Art from './Art.svelte';
import Options from './Options.svelte';
import RoundEntry from './RoundEntry.svelte';
import { defaultOptions, emptyEntry, isFlip7, score, type F7Entry, type F7Options } from './rules';

export const flip7: GameDefinition<F7Options, F7Entry> = {
  id: 'flip7',
  name: 'Flip 7',
  theme: 't-f7',
  themeColor: { light: '#ffc044', dark: '#33205d' },
  titleFont: 'var(--f-f7)',
  defaultOptions,
  emptyEntry,
  score: (e) => score(e),
  roundComplete: (round, game) => game.playerIds.every((id) => round.entries[id] && score(round.entries[id]) !== null),
  isOver: (game, _completed, totals) => Object.values(totals).some((t) => t >= game.options.target),
  roundLabel: (index, o) => `Round ${index + 1} · first to ${o.target}`,
  optionsTag: (o) => `To ${o.target}`,
  cellDetail: (e) => (e.bust ? 'bust' : e.hand && isFlip7(e.hand) ? 'Flip 7' : ''),
  progress: { kind: 'target', target: (o) => o.target },
  RoundEntry,
  Options,
  Art,
  minPlayers: 2,
  maxPlayers: 12,
};
