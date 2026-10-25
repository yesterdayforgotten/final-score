import type { GameDefinition } from '../types';
import Art from './Art.svelte';
import Options from './Options.svelte';
import RoundEntry from './RoundEntry.svelte';
import { bankState, defaultOptions, emptyEntry, emptyRound, score, type BankEntry, type BankOptions } from './rules';

export const bank: GameDefinition<BankOptions, BankEntry> = {
  id: 'bank',
  name: 'Bank',
  theme: 't-bank',
  themeColor: { light: '#11573f', dark: '#0d3a2b' },
  titleFont: 'var(--f-bank)',
  defaultOptions,
  emptyEntry,
  firstData: emptyRound,
  score: (e) => score(e),
  roundComplete: (round, game) =>
    bankState(round.data?.rolls ?? []).sevened || game.playerIds.every((id) => round.entries[id]?.banked != null),
  isOver: (game, completed) => completed >= game.options.rounds,
  roundLabel: (index, o) => `Round ${index + 1} of ${o.rounds}`,
  optionsTag: (o) => `${o.rounds} rounds`,
  cellDetail: (e) => (e.busted ? 'bust' : e.at !== null ? `roll ${e.at}` : ''),
  progress: { kind: 'rounds', maxRounds: (o) => o.rounds },
  RoundEntry,
  Options,
  midGameOptions: true,
  Art,
  minPlayers: 2,
  maxPlayers: 12,
};
