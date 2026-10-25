<script lang="ts">
  import Avatar from '../components/Avatar.svelte';
  import Band from '../components/Band.svelte';
  import Icon from '../components/Icon.svelte';
  import Ring from '../components/Ring.svelte';
  import ThemeButton from '../components/ThemeButton.svelte';
  import type { Game, GameDefinition, Player } from '../games/types';
  import { getPlayers, getRounds, listGames } from '../lib/db';
  import { completedRounds, leaders, standings, totals } from '../lib/engine';
  import { fmtDay, fmtDuration, plural } from '../lib/format';
  import { back, go } from '../lib/router.svelte';
  import { setThemeColor } from '../lib/theme';

  let { def }: { def: GameDefinition } = $props();

  $effect(() => setThemeColor(def.themeColor));

  interface Row { game: Game; order: { player: Player; score: number }[]; rounds: number }
  let active = $state<{ game: Game; done: number; leader?: string; score?: number } | null>(null);
  let history = $state<Row[]>([]);
  let loaded = $state(false);
  let topWinner = $state<{ name: string; wins: number } | null>(null);

  $effect(() => {
    const id = def.id;
    (async () => {
      const games = await listGames(id);
      const ids = [...new Set(games.flatMap((g) => g.playerIds))];
      const byId = new Map((await getPlayers(ids)).map((p) => [p.id, p]));
      const a = games.find((g) => g.status === 'active');
      if (a) {
        const rounds = await getRounds(a.id);
        const t = totals(def, a, rounds);
        const lead = leaders(t);
        active = { game: a, done: completedRounds(def, a, rounds), leader: lead.length === 1 ? byId.get(lead[0])?.name : undefined, score: lead.length === 1 ? t[lead[0]] : undefined };
      } else active = null;
      const rows: Row[] = [];
      const wins = new Map<string, number>();
      for (const g of games.filter((g) => g.status === 'finished')) {
        const t = g.finalScores ?? {};
        rows.push({
          game: g,
          order: standings(g, t).map((pid) => ({ player: byId.get(pid)!, score: t[pid] ?? 0 })).filter((x) => x.player),
          rounds: (await getRounds(g.id)).length,
        });
        for (const w of g.winnerIds ?? []) wins.set(w, (wins.get(w) ?? 0) + 1);
      }
      history = rows;
      const best = [...wins.entries()].sort((x, y) => y[1] - x[1])[0];
      topWinner = best ? { name: byId.get(best[0])?.name ?? '', wins: best[1] } : null;
      loaded = true;
    })();
  });
</script>

<div class="screen {def.theme}">
  <Band onback={() => back('/')}>
    {#snippet art()}<def.Art />{/snippet}
    {#snippet right()}<ThemeButton />{/snippet}
    {#snippet title()}<h1 style:font-family={def.titleFont} class="gt">{def.name}</h1>{/snippet}
    <p class="stat">
      {#if history.length}{plural(history.length, 'game')} played{#if topWinner} · {topWinner.name} has won {topWinner.wins}{/if}{:else}&nbsp;{/if}
    </p>
  </Band>

  <main class="content">
    {#if active}
      <button class="card lift resume" onclick={() => go(`/play/${active!.game.id}`)}>
        {#if def.progress.kind === 'rounds'}
          <Ring done={active.done} total={def.progress.maxRounds(active.game.options)} color="var(--p-gold)" />
        {:else}
          <span class="rnd num">R{active.done + 1}</span>
        {/if}
        <span class="t"><b>Game in progress</b><span>{active.leader ? `${active.leader} leads with ${active.score}` : 'Tap to carry on'}</span></span>
        <span class="go"><Icon name="next" /></span>
      </button>
    {/if}

    {#if history.length}
      <div class="sec"><span>Past games</span></div>
      {#each history as row, i (row.game.id)}
        <div class="card hist" class:lift={!active && i === 0}>
          <div class="hist-h">
            <div class="d">{fmtDay(row.game.createdAt)}<small>{plural(row.rounds, 'round')}{row.game.finishedAt ? ` · ${fmtDuration(row.game.finishedAt - row.game.createdAt)}` : ''}</small></div>
            <span class="chip">{def.optionsTag(row.game.options)}</span>
          </div>
          <div class="podium" style:--n={Math.min(row.order.length, 4)}>
            {#each row.order as o (o.player.id)}
              <div class:win={row.game.winnerIds?.includes(o.player.id)}>
                <Avatar player={o.player} size={28} />
                <b class="num">{o.score}</b>
                <small>{o.player.name}</small>
              </div>
            {/each}
          </div>
          <div class="hist-a">
            <button class="pill pri" onclick={() => go(`/g/${def.id}/new?from=${row.game.id}`)}><Icon name="repeat" size={16} stroke={2.4} />Rematch</button>
            <button class="pill" onclick={() => go(`/play/${row.game.id}`)}>Details</button>
          </div>
        </div>
      {/each}
    {:else if loaded && !active}
      <div class="card empty lift"><b>No games yet</b>Start one and it'll show up here with everyone's scores.</div>
    {/if}
  </main>

  <div class="dock">
    <button class="cta" onclick={() => go(`/g/${def.id}/new`)}><Icon name="plus" size={18} stroke={2.4} />New game</button>
  </div>
</div>

<style>
  .gt { font-size: 48px; color: var(--p-hdr-fg); }
  :global(.t-f7) .gt { font-weight: 700; font-size: 42px; }
  :global(.t-herd) .gt { font-size: 40px; }
  :global(.t-bank) .gt { font-size: 46px; letter-spacing: .02em; }
  .stat { margin: 6px 0 0; padding: 0 calc(var(--gutter-r) + 6px) 0 calc(var(--gutter-l) + 6px); font: 600 13.5px var(--f-ui); color: var(--p-hdr-muted); position: relative; }
  .resume { padding: 16px; display: flex; align-items: center; gap: 12px; text-align: left; width: 100%; }
  .t { flex: 1; min-width: 0; }
  .t b { display: block; font: 800 16px var(--f-ui); }
  .t span { font: 500 13px var(--f-ui); color: var(--p-muted); }
  .rnd { width: 46px; height: 46px; border-radius: 50%; display: grid; place-items: center; background: var(--p-accent-soft); color: var(--p-accent-text); font: 800 14px var(--f-ui); flex: none; }
  .go { width: 40px; height: 40px; border-radius: 50%; display: grid; place-items: center; background: var(--p-cta); color: var(--p-on-cta); flex: none; }
  .hist { padding: 14px; display: flex; flex-direction: column; gap: 12px; }
  .hist-h { display: flex; align-items: center; gap: 10px; }
  .d { flex: 1; font: 700 15px var(--f-ui); }
  .d small { display: block; font: 500 12.5px var(--f-ui); color: var(--p-muted); }
  .podium { display: grid; grid-template-columns: repeat(var(--n), 1fr); gap: 6px; }
  .podium div { display: flex; flex-direction: column; align-items: center; gap: 3px; padding: 8px 2px 7px; border-radius: 14px; background: var(--p-track); min-width: 0; }
  .podium div.win { background: var(--p-gold-soft); }
  .podium b { font: 800 15px var(--f-ui); }
  .podium small { font: 600 11px var(--f-ui); color: var(--p-muted); line-height: 1.1; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding: 0 4px; }
  .hist-a { display: flex; gap: 8px; }
</style>
