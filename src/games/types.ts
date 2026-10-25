import type { Component } from 'svelte';

export type GameStatus = 'active' | 'finished';

export interface Player {
  id: string;
  name: string;
  /** Lowercased, trimmed name; unique. */
  nameKey: string;
  color: number;
  lastUsedAt: number;
  timesPlayed: number;
}

export interface Game<O = unknown> {
  id: string;
  gameType: string;
  /** Seat order. */
  playerIds: string[];
  options: O;
  status: GameStatus;
  createdAt: number;
  updatedAt: number;
  finishedAt?: number;
  finalScores?: Record<string, number>;
  winnerIds?: string[];
}

export interface Round<E = unknown> {
  /** `${gameId}:${index}` */
  id: string;
  gameId: string;
  /** 0-based. */
  index: number;
  /** Game-defined step within a round (Skull King: 'bids' | 'tricks'). */
  phase?: string;
  entries: Record<string, E>;
  updatedAt: number;
}

export interface RoundEntryProps<O, E> {
  game: Game<O>;
  round: Round<E>;
  players: Player[];
  /** Totals before this round, by player id. */
  before: Record<string, number>;
  /** Editing a round that was already finished (button reads "Done"). */
  editing: boolean;
  /** Call after any change; the screen saves the round. */
  onchange: () => void;
  /** The round is complete and the player tapped the main button. */
  onnext: () => void;
}

export interface OptionsProps<O> {
  options: O;
}

/**
 * Everything the shared screens need to know about one game.
 * Adding a game = one rules module + RoundEntry/Options components + a registry entry.
 */
export interface GameDefinition<O = any, E = any> {
  id: string;
  name: string;
  /** CSS theme class applied to the screen root. */
  theme: string;
  /** Header colour for the browser/status bar, light and dark. */
  themeColor: { light: string; dark: string };
  defaultOptions: () => O;
  emptyEntry: () => E;
  /** Initial phase for a new round, if the game uses phases. */
  firstPhase?: string;
  /** Points for one player's entry in round `index`, or null while incomplete. */
  score: (entry: E, index: number, options: O) => number | null;
  roundComplete: (round: Round<E>, game: Game<O>) => boolean;
  /** Called after a round completes, with totals including it. */
  isOver: (game: Game<O>, completedRounds: number, totals: Record<string, number>) => boolean;
  /** Header line on the play screen, e.g. "Round 4 of 10 · 4 cards". */
  roundLabel: (index: number, options: O) => string;
  /** Short tag shown on history cards, e.g. "Classic". */
  optionsTag: (options: O) => string;
  /** Small detail line for a scoreboard cell, e.g. "1/1 +20". */
  cellDetail: (entry: E, index: number, options: O) => string;
  /** 'rounds' shows round dots (needs maxRounds); 'target' shows progress bars to a score. */
  progress: { kind: 'rounds'; maxRounds: (o: O) => number } | { kind: 'target'; target: (o: O) => number };
  RoundEntry: Component<RoundEntryProps<O, E>>;
  Options: Component<OptionsProps<O>>;
  /** Artwork for the home tile and header watermark. */
  Art: Component;
  /** Font family for the game title. */
  titleFont: string;
  minPlayers: number;
  maxPlayers: number;
}
