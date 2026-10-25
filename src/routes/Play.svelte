<script lang="ts">
  import Avatar from '../components/Avatar.svelte';
  import Band from '../components/Band.svelte';
  import Icon from '../components/Icon.svelte';
  import Sheet from '../components/Sheet.svelte';
  import TotalsStrip from '../components/TotalsStrip.svelte';
  import { gameById } from '../games/registry';
  import type { Game, Player, Round } from '../games/types';
  import { deleteGame, deleteRoundsFrom, getGame, getPlayers, getRounds, saveGame, saveRound } from '../lib/db';
  import { completedRounds, leaders, standings, totals } from '../lib/engine';
  import { fmtDay, fmtDuration, plural } from '../lib/format';
  import { back, go, route } from '../lib/router.svelte';
  import { setThemeColor } from '../lib/theme';
  import { keepAwake } from '../lib/wakelock';
  import Scoreboard from './Scoreboard.svelte';

  let { id }: { id: string } = $props();

  let game = $state<Game | null>(null);
  let rounds = $state<Round[]>([]);
  let players = $state<Player[]>([]);
  let missing = $state(false);
  let menu = $state(false);
  let confirm = $state<'end' | 'delete' | null>(null);

  const def = $derived(game ? gameById(game.gameType) : undefined);
  const board = $derived(route.path[2] === 'board');
  const editIndex = $derived(route.query.has('r') ? Number(route.query.get('r')) : null);
  const lastIndex = $derived(rounds.length ? rounds[rounds.length - 1].index : 0);
  const finished = $derived(game?.status === 'finished');
  const currentIndex = $derived(editIndex ?? lastIndex);
  const editing = $derived(editIndex !== null && (finished || editIndex < lastIndex));
  const view = $derived(board ? 'board' : finished && editIndex === null ? 'result' : 'round');
  const t = $derived(game && def ? totals(def, game, rounds) : {});
  const lead = $derived(leaders(t));
  const roundIdx = $derived(rounds.findIndex((r) => r.index === currentIndex));
  const before = $derived(game && def ? totals(def, game, rounds, currentIndex) : {});

  $effect(() => {
    if (def) setThemeColor(def.themeColor);
  });

  $effect(() => {
    if (view === 'round' && !finished) return keepAwake();
  });

  $effect(() => {
    const gid = id;
    (async () => {
      const g = await getGame(gid);
      const d = g && gameById(g.gameType);
      if (!g || !d) {
        missing = true;
        return;
      }
      const rs = await getRounds(gid);
      // Make sure every round has an entry for every player.
      for (const r of rs) for (const pid of g.playerIds) r.entries[pid] ??= d.emptyEntry();
      players = await getPlayers(g.playerIds);
      rounds = rs;
      game = g;
    })();
  });

  function save() {
    const r = rounds[roundIdx];
    if (!r || !game) return;
    void saveRound($state.snapshot(r) as Round);
    if (finished) void refreshFinal();
  }

  async function refreshFinal() {
    if (!game || !def) return;
    const final = totals(def, game, rounds);
    game.finalScores = final;
    game.winnerIds = leaders(final);
    await saveGame($state.snapshot(game) as Game);
  }

  async function finish() {
    if (!game || !def) return;
    game.status = 'finished';
    game.finishedAt = Date.now();
    await refreshFinal();
  }

  async function next() {
    if (!game || !def) return;
    if (editing) {
      if (finished) await refreshFinal();
      back(`/play/${game.id}`);
      return;
    }
    const done = completedRounds(def, game, rounds);
    if (def.isOver(game, done, totals(def, game, rounds))) {
      await finish();
      return;
    }
    const index = lastIndex + 1;
    const r: Round = {
      id: `${game.id}:${index}`,
      gameId: game.id,
      index,
      phase: def.firstPhase,
      entries: Object.fromEntries(game.playerIds.map((pid) => [pid, def.emptyEntry()])),
      updatedAt: Date.now(),
    };
    rounds.push(r);
    await saveRound(r);
    document.querySelector('.content')?.scrollTo({ top: 0 });
  }

  async function endNow() {
    if (!game || !def) return;
    confirm = null;
    menu = false;
    const done = completedRounds(def, game, rounds);
    if (done === 0) {
      await deleteGame(game.id);
      go(`/g/${def.id}`, { replace: true });
      return;
    }
    await deleteRoundsFrom(game.id, done);
    rounds = rounds.filter((r) => r.index < done);
    await finish();
    back(`/play/${game.id}`);
  }

  async function remove() {
    if (!game || !def) return;
    await deleteGame(game.id);
    go(`/g/${def.id}`, { replace: true });
  }

  function pick(index: number) {
    if (!game) return;
    if (!finished && index === lastIndex) back(`/play/${game.id}`);
    else go(`/play/${game.id}?r=${index}`, { replace: board });
  }

  const label = $derived(
    !game || !def ? '' : view === 'board' ? (finished ? 'Final scoreboard' : def.roundLabel(lastIndex, game.options)) : view === 'result' ? fmtDay(game.createdAt) : (editing ? 'Editing · ' : '') + def.roundLabel(currentIndex, game.options),
  );
</script>

{#if missing}
  <div class="screen t-base">
    <Band plain onback={() => go('/', { replace: true })} />
    <main class="content flat"><div class="card empty"><b>Game not found</b>It may have been deleted.</div></main>
  </div>
{:else if game && def}
  <div class="screen {def.theme}">
    <Band mid={label} onback={() => (view === 'board' || editing ? back(`/play/${game!.id}`) : back(`/g/${def!.id}`))} backIcon={view === 'board' ? 'x' : 'back'}>
      {#snippet art()}<def.Art />{/snippet}
      {#snippet right()}
        {#if view === 'round'}
          <button class="ibtn" aria-label="Scoreboard" onclick={() => go(`/play/${game!.id}/board`)}><Icon name="grid" /></button>
        {:else}
          <button class="ibtn" aria-label="More" onclick={() => (menu = true)}><Icon name="more" /></button>
        {/if}
      {/snippet}
      {#snippet title()}
        {#if view === 'result'}
          <h1 class="ut">Final scores</h1>
        {:else if view === 'board'}
          <h1 class="ut">Scoreboard</h1>
        {:else}
          <h1 class="gt" style:font-family={def!.titleFont}>{def!.name}</h1>
          {#if def!.progress.kind === 'rounds'}
            {@const max = def!.progress.maxRounds(game!.options)}
            <div class="dots" aria-hidden="true">
              {#each { length: max } as _, i}<i class:done={i < currentIndex} class:now={i === currentIndex}></i>{/each}
            </div>
          {/if}
        {/if}
      {/snippet}
      {#if view === 'round'}
        <TotalsStrip {players} totals={t} leaders={lead} target={def.progress.kind === 'target' ? def.progress.target(game.options) : undefined} />
      {/if}
    </Band>

    <main class="content">
      {#if view === 'board'}
        <div style="height: 8px"></div>
        <Scoreboard {def} {game} {rounds} {players} current={finished ? -1 : lastIndex} onpick={pick} />
      {:else if view === 'result'}
        {@const order = standings(game, game.finalScores ?? t)}
        {@const winners = game.winnerIds ?? lead}
        {@const champ = players.find((p) => p.id === winners[0])}
        {#if champ}
          <div class="card lift hero">
            <svg class="crown" viewBox="0 0 20 14" aria-hidden="true"><path fill="currentColor" d="M1 3.5l4.5 4L10 0l4.5 7.5L19 3.5 17.2 14H2.8z" /></svg>
            <Avatar player={champ} size={72} />
            <b>{winners.length > 1 ? `${winners.map((w) => players.find((p) => p.id === w)?.name).join(' & ')} tie` : `${champ.name} wins`}</b>
            <span class="num">{(game.finalScores ?? t)[champ.id]} points · {plural(rounds.length, 'round')}{game.finishedAt ? ` · ${fmtDuration(game.finishedAt - game.createdAt)}` : ''}</span>
          </div>
        {/if}
        <div class="card">
          {#each order as pid, i (pid)}
            {@const p = players.find((x) => x.id === pid)!}
            <div class="lrow">
              <span class="rank num">{i + 1}</span>
              <Avatar player={p} />
              <span class="pn">{p.name}</span>
              <b class="num total" class:win={winners.includes(pid)}>{(game.finalScores ?? t)[pid]}</b>
            </div>
          {/each}
        </div>
        <button class="pill" style="flex: none; height: 48px" onclick={() => go(`/play/${game!.id}/board`)}><Icon name="grid" size={18} />Round by round</button>
      {:else if roundIdx >= 0}
        <def.RoundEntry {game} bind:round={rounds[roundIdx]} {players} {before} {editing} onchange={save} onnext={next} />
      {/if}
    </main>

    {#if view === 'result'}
      <div class="dock">
        <button class="cta alt" aria-label="Home" onclick={() => go('/', { replace: true })}><Icon name="home" /></button>
        <button class="cta" onclick={() => go(`/g/${def!.id}/new?from=${game!.id}`)}><Icon name="repeat" size={18} stroke={2.4} />Rematch</button>
      </div>
    {:else if view === 'board'}
      <div class="dock">
        <button class="cta" onclick={() => back(`/play/${game!.id}`)}>{finished ? 'Final scores' : `Back to round ${lastIndex + 1}`}</button>
      </div>
    {/if}

    <Sheet open={menu} onclose={() => ((menu = false), (confirm = null))} label="Game options">
      {#if confirm === 'end'}
        <p class="q"><b>End the game now?</b>Scores from finished rounds are kept{completedRounds(def, game, rounds) === 0 ? '. No rounds are finished, so the game will be removed.' : ' and the unfinished round is dropped.'}</p>
        <div class="row"><button class="cta soft" onclick={() => (confirm = null)}>Cancel</button><button class="cta" onclick={endNow}>End game</button></div>
      {:else if confirm === 'delete'}
        <p class="q"><b>Delete this game?</b>Its scores will be gone for good.</p>
        <div class="row"><button class="cta soft" onclick={() => (confirm = null)}>Cancel</button><button class="cta danger" onclick={remove}>Delete</button></div>
      {:else}
        <div class="menu">
          {#if !finished}
            <button onclick={() => (confirm = 'end')}><Icon name="flag" />End game now</button>
          {/if}
          <button class="bad" onclick={() => (confirm = 'delete')}><Icon name="trash" />Delete game</button>
        </div>
      {/if}
    </Sheet>
  </div>
{/if}

<style>
  .gt { font-size: 44px; color: var(--p-hdr-fg); }
  :global(.t-f7) .gt { font-weight: 700; font-size: 38px; }
  .ut { font: 800 32px var(--f-ui) !important; letter-spacing: -.02em; color: var(--p-hdr-fg); }
  .dots { display: flex; gap: 5px; padding-bottom: 6px; }
  .dots i { width: 7px; height: 7px; border-radius: 50%; background: var(--p-hdr-chip-strong); transition: width .25s ease; }
  .dots i.done { background: var(--p-hdr-muted); }
  .dots i.now { width: 20px; border-radius: 4px; background: var(--p-gold); }
  .hero { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 26px 16px 20px; text-align: center; margin-top: 4px; }
  .hero .crown { width: 34px; height: 24px; color: var(--p-gold); margin-bottom: -2px; }
  .hero b { font: 800 22px var(--f-ui); letter-spacing: -.02em; margin-top: 6px; }
  .hero span { font: 500 13.5px var(--f-ui); color: var(--p-muted); }
  .rank { width: 18px; text-align: center; font: 700 13px var(--f-ui); color: var(--p-muted); flex: none; }
  .pn { flex: 1; min-width: 0; font: 700 16px var(--f-ui); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .total { font: 800 20px var(--f-ui); }
  .total.win { color: var(--p-gold-text); }
  .menu { display: flex; flex-direction: column; }
  .menu button { display: flex; align-items: center; gap: 12px; padding: 14px 8px; font: 600 16px var(--f-ui); border-radius: 12px; text-align: left; }
  .menu button + button { border-top: 1px solid var(--p-hair); }
  .menu .bad { color: var(--p-bad); }
  .q { margin: 4px 4px 0; font: 500 14.5px var(--f-ui); color: var(--p-muted); }
  .q b { display: block; font: 800 18px var(--f-ui); color: var(--p-fg); margin-bottom: 4px; }
  .row { display: flex; gap: 10px; }
</style>
