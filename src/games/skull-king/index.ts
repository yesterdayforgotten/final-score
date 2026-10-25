import type { GameDefinition } from '../types';
import Art from './Art.svelte';
import Options from './Options.svelte';
import RoundEntry from './RoundEntry.svelte';
import { bonusCounts, bonusPoints, cardsDealt, defaultOptions, emptyEntry, score, type SkEntry, type SkOptions } from './rules';

export const skullKing: GameDefinition<SkOptions, SkEntry> = {
  id: 'skull-king',
  name: 'Skull King',
  theme: 't-sk',
  themeColor: { light: '#22355f', dark: '#172340' },
  titleFont: 'var(--f-sk)',
  defaultOptions,
  emptyEntry,
  firstPhase: 'bids',
  score,
  roundComplete: (round, game) =>
    round.phase === 'tricks' && game.playerIds.every((id) => round.entries[id]?.bid != null && round.entries[id]?.tricks != null),
  isOver: (game, completed) => completed >= game.options.rounds,
  roundLabel: (index, o) => `Round ${index + 1} of ${o.rounds} · ${cardsDealt(index)} ${index === 0 ? 'card' : 'cards'}`,
  optionsTag: (o) => (o.scoring === 'rascal' ? 'Rascal' : 'Classic'),
  cellDetail: (e, _i, o) => {
    if (e.bid === null) return '';
    const b = bonusCounts(e, o) ? bonusPoints(e.bonus) : 0;
    return `${e.bid}/${e.tricks ?? '–'}${e.cannonball ? ' C' : ''}${b ? ` +${b}` : ''}`;
  },
  progress: { kind: 'rounds', maxRounds: (o) => o.rounds },
  RoundEntry,
  Options,
  Art,
  minPlayers: 2,
  maxPlayers: 8,
};
