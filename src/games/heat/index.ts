import type { GameDefinition } from '../types';
import Art from './Art.svelte';
import Options from './Options.svelte';
import RoundEntry from './RoundEntry.svelte';
import { defaultOptions, emptyEntry, isOver, score, type HeatEntry, type HeatOptions } from './rules';

export const beatTheHeat: GameDefinition<HeatOptions, HeatEntry> = {
  id: 'beat-the-heat',
  name: 'Beat the Heat',
  theme: 't-heat',
  themeColor: { light: '#e2432f', dark: '#5a170f' },
  titleFont: 'var(--f-heat)',
  defaultOptions,
  emptyEntry,
  score: (e) => score(e),
  roundComplete: (round, game) => game.playerIds.every((id) => round.entries[id] && score(round.entries[id]) !== null),
  isOver: (game, _completed, totals) => isOver(game.options, totals),
  roundLabel: (index, o) => `Round ${index + 1} · ends at ${o.target}`,
  optionsTag: (o) => `To ${o.target}`,
  cellDetail: () => '',
  progress: (o) => ({ kind: 'target', target: o.target }),
  lowWins: () => true,
  RoundEntry,
  Options,
  midGameOptions: true,
  Art,
  minPlayers: 2,
  maxPlayers: 10,
};
