import type { GameDefinition } from '../types';
import Art from './Art.svelte';
import Options from './Options.svelte';
import RoundEntry from './RoundEntry.svelte';
import { defaultOptions, emptyEntry, emptyRound, isOver, score, winners, type HerdEntry, type HerdOptions } from './rules';

export const herd: GameDefinition<HerdOptions, HerdEntry> = {
  id: 'herd',
  name: 'Herd Mentality',
  theme: 't-herd',
  themeColor: { light: '#e8478f', dark: '#5a1a3c' },
  titleFont: 'var(--f-herd)',
  defaultOptions,
  emptyEntry,
  firstData: emptyRound,
  score: (e) => score(e),
  roundComplete: (round) => round.data?.done === true,
  isOver: (game, _completed, totals, rounds) => isOver(game, totals, rounds),
  winners,
  roundLabel: (index, o) => `Round ${index + 1} · first to ${o.target} cows`,
  optionsTag: (o) => `To ${o.target}`,
  cellDetail: (e) => (e.odd ? 'pink' : e.herd ? 'herd' : ''),
  progress: { kind: 'target', target: (o) => o.target },
  RoundEntry,
  Options,
  midGameOptions: true,
  Art,
  minPlayers: 3,
  maxPlayers: 20,
};
