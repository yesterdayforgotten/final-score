import type { GameDefinition } from '../types';
import Art from './Art.svelte';
import Options from './Options.svelte';
import RoundEntry from './RoundEntry.svelte';
import { defaultOptions, displayName, emptyEntry, isOver, score, type AnyEntry, type AnyOptions } from './rules';

export const anyGame: GameDefinition<AnyOptions, AnyEntry> = {
  id: 'any',
  name: 'Any game',
  theme: 't-any',
  themeColor: { light: '#3d4bc4', dark: '#1d2360' },
  titleFont: 'var(--f-ui)',
  defaultOptions,
  emptyEntry,
  score: (e) => score(e),
  roundComplete: (round, game) => game.playerIds.every((id) => round.entries[id]?.value != null),
  isOver: (game, completed, totals) => isOver(game.options, completed, totals),
  roundLabel: (index, o) =>
    o.end === 'rounds' ? `Round ${index + 1} of ${o.rounds}` : o.end === 'target' ? `Round ${index + 1} · to ${o.target}` : `Round ${index + 1}`,
  optionsTag: (o) => [o.title.trim(), o.lowWins ? 'Low wins' : ''].filter(Boolean).join(' · ') || 'Any game',
  cellDetail: () => '',
  progress: (o) => (o.end === 'rounds' ? { kind: 'rounds', max: o.rounds } : o.end === 'target' ? { kind: 'target', target: o.target } : { kind: 'open' }),
  lowWins: (o) => o.lowWins,
  displayName,
  customName: { key: 'title', placeholder: 'Uno, Hearts, Rummy…' },
  RoundEntry,
  Options,
  midGameOptions: true,
  Art,
  minPlayers: 1,
  maxPlayers: 20,
};
