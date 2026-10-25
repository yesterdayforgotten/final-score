import type { GameDefinition } from '../types';
import Art from './Art.svelte';
import Options from './Options.svelte';
import RoundEntry from './RoundEntry.svelte';
import { bonusCounts, bonusPoints, cardsDealt, defaultOptions, emptyEntry, firstCards, lastCards, roundCount, score, type SkEntry, type SkOptions } from './rules';

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
  isOver: (game, completed) => completed >= roundCount(game.options),
  roundLabel: (index, o) => {
    const n = cardsDealt(index, o);
    return `Round ${index + 1} of ${roundCount(o)} · ${n} ${n === 1 ? 'card' : 'cards'}`;
  },
  optionsTag: (o) => {
    const name = o.scoring === 'rascal' ? 'Rascal' : 'Classic';
    return firstCards(o) === 1 && lastCards(o) === 10 ? name : `${name} · ${firstCards(o)}–${lastCards(o)}`;
  },
  cellDetail: (e, _i, o) => {
    if (e.bid === null) return '';
    const b = bonusCounts(e, o) ? bonusPoints(e.bonus) : 0;
    return `${e.bid}/${e.tricks ?? '–'}${e.cannonball ? ' C' : ''}${b ? ` +${b}` : ''}`;
  },
  progress: { kind: 'rounds', maxRounds: roundCount },
  RoundEntry,
  Options,
  midGameOptions: true,
  Art,
  minPlayers: 2,
  maxPlayers: 8,
};
