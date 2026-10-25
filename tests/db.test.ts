import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  createGame, db, deleteGame, findOrCreatePlayer, forgetPlayer, getGame, getRounds, listGames, listPlayers, renamePlayer, saveRound, suggestPlayers, useDatabase,
} from '../src/lib/db';

let n = 0;
beforeEach(() => useDatabase(`test-${n++}`));

const round0 = { entries: {} };

describe('players', () => {
  it('reuses a player regardless of case and spacing', async () => {
    const a = await findOrCreatePlayer('Maya');
    const b = await findOrCreatePlayer('  maya ');
    expect(b.id).toBe(a.id);
    expect(await db.players.count()).toBe(1);
  });

  it('spreads colours across new players', async () => {
    const colors = [];
    for (const name of ['A', 'B', 'C', 'D']) colors.push((await findOrCreatePlayer(name)).color);
    expect(new Set(colors).size).toBe(4);
  });

  it('rejects an empty name', async () => {
    await expect(findOrCreatePlayer('   ')).rejects.toThrow();
  });
});

describe('suggestions', () => {
  async function play(gameType: string, names: string[], at: number) {
    const ids = [];
    for (const nm of names) ids.push((await findOrCreatePlayer(nm)).id);
    const g = await createGame(gameType, ids, {}, round0);
    await db.games.update(g.id, { createdAt: at });
    return ids;
  }

  it('matches prefixes, putting players of this game first', async () => {
    await play('flip7', ['Preston'], 3000);
    await play('skull-king', ['Priya'], 1000);
    const s = await suggestPlayers('pr', 'skull-king');
    expect(s.map((x) => x.player.name)).toEqual(['Priya', 'Preston']);
    expect(s[0].lastHere).toBe(1000);
    expect(s[1].lastHere).toBeUndefined();
  });

  it('matches the start of a later word', async () => {
    await play('flip7', ['Mary Jane'], 1);
    expect((await suggestPlayers('ja', 'flip7')).map((x) => x.player.name)).toEqual(['Mary Jane']);
  });

  it('leaves out players already added and players never in a game', async () => {
    const [maya] = await play('flip7', ['Maya', 'Max'], 1);
    await findOrCreatePlayer('Mallory');
    expect((await suggestPlayers('ma', 'flip7', [maya])).map((x) => x.player.name)).toEqual(['Max']);
  });

  it('returns recent players for an empty query', async () => {
    await play('flip7', ['Old'], 1);
    await play('flip7', ['New'], 2);
    expect((await suggestPlayers('', 'flip7')).map((x) => x.player.name)).toEqual(['New', 'Old']);
  });
});

describe('games', () => {
  it('creates a game with its first round and records play counts', async () => {
    const p = await findOrCreatePlayer('Maya');
    const g = await createGame('flip7', [p.id], { target: 200 }, round0);
    expect((await getRounds(g.id)).map((r) => r.index)).toEqual([0]);
    expect((await db.players.get(p.id))?.timesPlayed).toBe(1);
  });

  it('saves rounds in order and lists games newest first', async () => {
    const p = await findOrCreatePlayer('Maya');
    const g1 = await createGame('flip7', [p.id], {}, round0);
    await db.games.update(g1.id, { createdAt: 1 });
    const g2 = await createGame('flip7', [p.id], {}, round0);
    await saveRound({ id: `${g2.id}:1`, gameId: g2.id, index: 1, entries: { [p.id]: 5 }, updatedAt: 0 });
    expect((await getRounds(g2.id)).map((r) => r.index)).toEqual([0, 1]);
    expect((await listGames('flip7')).map((g) => g.id)).toEqual([g2.id, g1.id]);
  });

  it('deletes a game and its rounds', async () => {
    const p = await findOrCreatePlayer('Maya');
    const g = await createGame('flip7', [p.id], {}, round0);
    await deleteGame(g.id);
    expect(await getGame(g.id)).toBeUndefined();
    expect(await getRounds(g.id)).toEqual([]);
  });
});

describe('managing players', () => {
  it('forgets a player with history by hiding them from suggestions', async () => {
    const p = await findOrCreatePlayer('Sam');
    await createGame('flip7', [p.id], {}, round0);
    await forgetPlayer(p.id);
    expect(await suggestPlayers('', 'flip7')).toEqual([]);
    expect((await db.players.get(p.id))?.name).toBe('Sam');
    expect((await listPlayers()).map((x) => x.player.name)).toEqual([]);
  });

  it('removes a player with no games entirely', async () => {
    const p = await findOrCreatePlayer('Typo');
    await forgetPlayer(p.id);
    expect(await db.players.get(p.id)).toBeUndefined();
  });

  it('brings a forgotten player back when their name is typed again', async () => {
    const p = await findOrCreatePlayer('Sam');
    await createGame('flip7', [p.id], {}, round0);
    await forgetPlayer(p.id);
    const again = await findOrCreatePlayer('sam');
    expect(again.id).toBe(p.id);
    expect((await suggestPlayers('', 'flip7')).map((x) => x.player.name)).toEqual(['Sam']);
  });

  it('renames, refusing a name another player already has', async () => {
    const a = await findOrCreatePlayer('Mya');
    await findOrCreatePlayer('Theo');
    expect(await renamePlayer(a.id, 'Maya')).toEqual({ ok: true });
    expect((await db.players.get(a.id))?.name).toBe('Maya');
    expect((await renamePlayer(a.id, 'theo')).ok).toBe(false);
  });

  it('counts games per player', async () => {
    const a = await findOrCreatePlayer('Maya');
    await createGame('flip7', [a.id], {}, round0);
    await createGame('bank', [a.id], {}, round0);
    expect((await listPlayers())[0]).toMatchObject({ games: 2 });
  });
});
