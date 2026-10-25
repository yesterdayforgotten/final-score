<script lang="ts">
  import Avatar from '../components/Avatar.svelte';
  import Band from '../components/Band.svelte';
  import Icon from '../components/Icon.svelte';
  import Ring from '../components/Ring.svelte';
  import Settings from '../components/Settings.svelte';
  import Sheet from '../components/Sheet.svelte';
  import ThemeButton from '../components/ThemeButton.svelte';
  import { GAMES, gameById } from '../games/registry';
  import type { Game, Player } from '../games/types';
  import { activeGames, deleteGame, getPlayers, getRounds, listGames } from '../lib/db';
  import { longpress } from '../lib/longpress';
  import { completedRounds, isLow, leaders, progressOf, titleOf, totals } from '../lib/engine';
  import { fmtShort, fmtTime, plural } from '../lib/format';
  import { go } from '../lib/router.svelte';
  import { BASE_COLOR, setThemeColor } from '../lib/theme';

  setThemeColor(BASE_COLOR);

  interface Resume { game: Game; players: Player[]; done: number; leader?: string }
  let resumes = $state<Resume[]>([]);
  let settings = $state(false);
  let stats = $state<Record<string, { count: number; last?: number }>>({});

  const today = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'short', day: 'numeric' }).format(Date.now());

  let picked = $state<Resume | null>(null);
  let confirmDelete = $state(false);

  async function removePicked() {
    if (!picked) return;
    await deleteGame(picked.game.id);
    picked = null;
    confirmDelete = false;
    await load();
  }

  $effect(() => {
    void load();
  });

  async function load() {
    {
      const out: Resume[] = [];
      for (const g of await activeGames()) {
        const def = gameById(g.gameType);
        if (!def) continue;
        const rounds = await getRounds(g.id);
        const players = await getPlayers(g.playerIds);
        const t = totals(def, g, rounds);
        const lead = leaders(t, isLow(def, g.options));
        out.push({ game: g, players, done: completedRounds(def, g, rounds), leader: lead.length === 1 ? players.find((p) => p.id === lead[0])?.name : undefined });
      }
      resumes = out;
      const s: typeof stats = {};
      for (const def of GAMES) {
        const games = (await listGames(def.id)).filter((g) => g.status === 'finished');
        s[def.id] = { count: games.length, last: games[0]?.createdAt };
      }
      stats = s;
    }
  }
</script>

<div class="screen t-base">
  <Band plain>
    {#snippet right()}
      <span class="rb"><ThemeButton /><button class="ibtn" aria-label="Settings" onclick={() => (settings = true)}><Icon name="gear" /></button></span>
    {/snippet}
    <div class="big"><small>{today}</small><h1>Final Score</h1></div>
  </Band>
  <main class="content flat">
    {#each resumes as r (r.game.id)}
      {@const def = gameById(r.game.gameType)!}
      {@const prog = progressOf(def, r.game.options)}
      <div class="card resume {def.theme}" use:longpress={() => ((picked = r), (confirmDelete = false))} title="Long-press for options">
        <div class="top">
          {#if prog.kind === 'rounds'}
            <Ring done={r.done} total={prog.max} />
          {:else}
            <span class="rnd num">R{r.done + 1}</span>
          {/if}
          <div class="t"><b>{titleOf(def, r.game.options)} in progress</b><span>{r.leader ? `${r.leader} leads · ` : ''}{fmtTime(r.game.createdAt)}</span></div>
          <div class="avs">{#each r.players.slice(0, 4) as p (p.id)}<Avatar player={p} size={28} ring />{/each}</div>
        </div>
        <button class="cta small" onclick={() => go(`/play/${r.game.id}`)}>Resume game</button>
      </div>
    {/each}

    {#each GAMES as def (def.id)}
      {@const s = stats[def.id]}
      <button class="gtile tile-{def.id}" onclick={() => go(`/g/${def.id}`)}>
        <span class="art"><def.Art /></span>
        <h2 style:font-family={def.titleFont}>{def.name}</h2>
        <span class="meta">{s?.count ? `${plural(s.count, 'game')} · last ${fmtShort(s.last!)}` : 'No games yet'}</span>
        <span class="go"><Icon name="next" /></span>
      </button>
    {/each}
  </main>
  <Sheet open={picked !== null} onclose={() => (picked = null)} label="Game in progress">
    {#if picked}
      {@const pdef = gameById(picked.game.gameType)!}
      {#if confirmDelete}
        <p class="q"><b>Delete this {titleOf(pdef, picked.game.options)} game?</b>Its scores so far will be gone for good.</p>
        <div class="row"><button class="cta soft" onclick={() => (confirmDelete = false)}>Cancel</button><button class="cta danger" onclick={removePicked}>Delete</button></div>
      {:else}
        <p class="q"><b>{titleOf(pdef, picked.game.options)} in progress</b>{picked.players.map((p) => p.name).join(', ')} · started {fmtTime(picked.game.createdAt)}</p>
        <div class="menu">
          <button onclick={() => { const id = picked!.game.id; picked = null; go(`/play/${id}`); }}><Icon name="next" />Resume game</button>
          <button class="bad" onclick={() => (confirmDelete = true)}><Icon name="trash" />Delete game</button>
        </div>
      {/if}
    {/if}
  </Sheet>
  <Sheet open={settings} onclose={() => (settings = false)} label="Settings">
    <h2 class="sh">Settings</h2>
    <Settings />
    <button class="mp" onclick={() => { settings = false; go('/players'); }}><Icon name="edit" size={18} />Manage players<Icon name="next" size={18} /></button>
    <button class="cta" style="flex: none" onclick={() => (settings = false)}>Done</button>
  </Sheet>
</div>

<style>
  .rb { display: flex; gap: 8px; }
  .q { margin: 4px 4px 0; font: 500 14.5px var(--f-ui); color: var(--p-muted); }
  .q b { display: block; font: 800 18px var(--f-ui); color: var(--p-fg); margin-bottom: 4px; }
  .row { display: flex; gap: 10px; }
  .menu { display: flex; flex-direction: column; }
  .menu button { display: flex; align-items: center; gap: 12px; padding: 14px 8px; font: 600 16px var(--f-ui); text-align: left; }
  .menu button + button { border-top: 1px solid var(--p-hair); }
  .menu .bad { color: var(--p-bad); }
  .mp { display: flex; align-items: center; gap: 10px; padding: 14px 6px; font: 700 15px var(--f-ui); border-top: 1px solid var(--p-hair); text-align: left; }
  .mp :global(svg:last-child) { margin-left: auto; color: var(--p-muted); }
  .sh { margin: 0 4px; font: 800 20px var(--f-ui); letter-spacing: -.01em; }
  .big { padding: 6px calc(var(--gutter-r) + 8px) 0 calc(var(--gutter-l) + 8px); }
  .big small { font: 600 13px var(--f-ui); color: var(--p-muted); text-transform: uppercase; letter-spacing: .08em; }
  .big h1 { margin: 2px 0 0; font: 800 36px var(--f-ui); letter-spacing: -.03em; line-height: 1.05; }
  .content { gap: 12px; padding-top: 12px; }
  .resume { padding: 16px; display: flex; flex-direction: column; gap: 14px; background: var(--p-surface); color: var(--p-fg); }
  .top { display: flex; align-items: center; gap: 12px; }
  .t { flex: 1; min-width: 0; }
  .t b { display: block; font: 800 16px var(--f-ui); letter-spacing: -.01em; }
  .t span { font: 500 13px var(--f-ui); color: var(--p-muted); }
  .rnd { width: 46px; height: 46px; border-radius: 50%; display: grid; place-items: center; background: var(--p-accent-soft); color: var(--p-accent-text); font: 800 14px var(--f-ui); flex: none; }
  .avs { display: flex; }
  .avs :global(.av + .av) { margin-left: -7px; }
  .gtile {
    position: relative; border-radius: 24px; overflow: hidden; height: 104px; padding: 14px 18px; width: 100%;
    display: flex; flex-direction: column; justify-content: center; align-items: flex-start; text-align: left;
    box-shadow: 0 14px 24px -16px rgba(0,0,0,.45); transition: transform .15s ease;
  }
  .gtile:active { transform: scale(.985); }
  .gtile h2 { margin: 0; line-height: 1; font-weight: 700; position: relative; font-size: 30px; }
  .meta { font: 600 12.5px var(--f-ui); opacity: .85; margin-top: 5px; position: relative; }
  .go { position: absolute; right: 16px; top: 50%; transform: translateY(-50%); width: 36px; height: 36px; border-radius: 50%; display: grid; place-items: center; background: rgba(255,255,255,.18); }
  /* Artwork shrunk and parked just left of the arrow. */
  .art { position: absolute; right: 60px; top: 50%; transform: translateY(-50%) scale(.6); transform-origin: right center; pointer-events: none; }
  .tile-skull-king { background: radial-gradient(120% 90% at 85% 10%, #2c4677 0%, #16233f 55%, #0d1629 100%); color: #f3e7c6; }
  .tile-skull-king h2 { font-size: 34px; font-weight: 400; }
  .tile-skull-king .art { width: 112px; height: 112px; color: #d4a12a; filter: drop-shadow(0 8px 14px rgba(0,0,0,.35)); }
  .tile-skull-king .art :global(svg) { width: 100%; height: 100%; }
  .tile-flip7 { background: radial-gradient(120% 100% at 90% 0%, #ffd34d 0%, #ffb02e 45%, #ff7a3d 100%); color: #2a1a3e; }
  .tile-flip7 h2 { letter-spacing: -.01em; }
  .tile-flip7 .go { background: rgba(42,26,62,.12); }
  .tile-herd { background: radial-gradient(120% 100% at 85% 0%, #ffa3cb 0%, #ff5fa2 45%, #c2256f 100%); color: #fff; }
  .tile-herd h2 { font-weight: 400; letter-spacing: .01em; font-size: 27px; }
  .tile-herd .art { transform: translateY(-50%) scale(.5); right: 56px; }
  .tile-any { background: radial-gradient(120% 100% at 85% 0%, #7d8cff 0%, #4b5bd6 50%, #232c80 100%); color: #fff; }
  .tile-any h2 { font-weight: 800; letter-spacing: -.02em; }
  .tile-any .art { width: 130px; filter: drop-shadow(0 8px 14px rgba(0,0,0,.3)); }
  .tile-any .art :global(svg) { width: 100%; height: auto; display: block; }
  .tile-bank { background: radial-gradient(120% 100% at 85% 0%, #23966b 0%, #11573f 50%, #08291e 100%); color: #f6ecc9; }
  .tile-bank h2 { font-size: 32px; font-weight: 400; letter-spacing: .02em; }
  .tile-bank .art { width: 150px; filter: drop-shadow(0 8px 14px rgba(0,0,0,.35)); }
  .tile-bank .art :global(svg) { width: 100%; height: auto; display: block; }
</style>
