<script lang="ts">
  import Avatar from '../components/Avatar.svelte';
  import Band from '../components/Band.svelte';
  import Icon from '../components/Icon.svelte';
  import type { GameDefinition, Player } from '../games/types';
  import { createGame, findOrCreatePlayer, getGame, getPlayers, nameKey, requestPersistence, suggestPlayers, type Suggestion } from '../lib/db';
  import { fmtShort } from '../lib/format';
  import { back, go } from '../lib/router.svelte';
  import { setThemeColor } from '../lib/theme';

  let { def, from }: { def: GameDefinition; from: string | null } = $props();

  $effect(() => setThemeColor(def.themeColor));

  let seats = $state<Player[]>([]);
  // svelte-ignore state_referenced_locally
  let options = $state(def.defaultOptions());
  let query = $state('');
  let suggestions = $state<Suggestion[]>([]);
  let recents = $state<Suggestion[]>([]);
  let starting = $state(false);
  let input: HTMLInputElement | undefined = $state();

  const full = $derived(seats.length >= def.maxPlayers);
  const seatIds = $derived(seats.map((p) => p.id));
  const exactMatch = $derived(suggestions.some((s) => s.player.nameKey === nameKey(query)) || seats.some((p) => p.nameKey === nameKey(query)));

  // Rematch: same players, same seats, same options.
  $effect(() => {
    if (!from) return;
    (async () => {
      const g = await getGame(from);
      if (!g || g.gameType !== def.id) return;
      seats = await getPlayers(g.playerIds);
      options = structuredClone(g.options);
    })();
  });

  $effect(() => {
    const q = query;
    const exclude = seatIds;
    let stale = false;
    suggestPlayers(q, def.id, exclude, q ? 5 : 8).then((s) => {
      if (stale) return;
      if (q) suggestions = s;
      else recents = s;
    });
    return () => (stale = true);
  });

  async function add(name: string) {
    if (!name.trim() || full) return;
    const p = await findOrCreatePlayer(name);
    if (!seats.some((s) => s.id === p.id)) seats.push(p);
    query = '';
    input?.focus();
  }

  function addPlayer(p: Player) {
    if (full || seats.some((s) => s.id === p.id)) return;
    seats.push(p);
    query = '';
  }

  function remove(i: number) {
    seats.splice(i, 1);
  }

  // Drag to reorder by the grip.
  let dragging = $state<number | null>(null);
  let dy = $state(0);
  let startY = 0;
  let rowH = 56;

  function dragStart(e: PointerEvent, i: number) {
    const row = (e.currentTarget as HTMLElement).closest('.lrow') as HTMLElement;
    rowH = row.offsetHeight;
    dragging = i;
    startY = e.clientY;
    dy = 0;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function dragMove(e: PointerEvent) {
    if (dragging === null) return;
    dy = e.clientY - startY;
    const shift = Math.round(dy / rowH);
    const target = Math.max(0, Math.min(seats.length - 1, dragging + shift));
    if (target !== dragging) {
      const [p] = seats.splice(dragging, 1);
      seats.splice(target, 0, p);
      startY += (target - dragging) * rowH;
      dragging = target;
      dy = e.clientY - startY;
    }
  }

  function dragEnd() {
    dragging = null;
    dy = 0;
  }

  async function start() {
    if (seats.length < def.minPlayers || starting) return;
    starting = true;
    void requestPersistence();
    const entries = Object.fromEntries(seats.map((p) => [p.id, def.emptyEntry()]));
    const g = await createGame(def.id, seatIds, $state.snapshot(options), { entries, phase: def.firstPhase });
    go(`/play/${g.id}`, { replace: true });
  }

  function onkey(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      void add(query);
    }
  }

  const lastPlayed = (s: Suggestion) => (s.lastHere ? `${def.name} · ${fmtShort(s.lastHere)}` : 'From other games');
</script>

<div class="screen {def.theme}">
  <Band onback={() => back(`/g/${def.id}`)} backIcon="x" backLabel="Cancel" mid={def.name}>
    {#snippet art()}<def.Art />{/snippet}
    {#snippet title()}<h1 class="h">New game</h1>{/snippet}
  </Band>

  <main class="content">
    {#if seats.length}
      <div class="card lift seats" class:dragging={dragging !== null}>
        {#each seats as p, i (p.id)}
          <div class="lrow" class:lifted={dragging === i} style:transform={dragging === i ? `translateY(${dy}px)` : ''}>
            <span class="seatno num">{i + 1}</span>
            <Avatar player={p} />
            <span class="nm">{p.name}</span>
            <button class="x" aria-label="Remove {p.name}" onclick={() => remove(i)}><Icon name="x" size={18} /></button>
            <span
              class="grip"
              role="button"
              tabindex="-1"
              aria-label="Drag to reorder {p.name}"
              onpointerdown={(e) => dragStart(e, i)}
              onpointermove={dragMove}
              onpointerup={dragEnd}
              onpointercancel={dragEnd}><Icon name="grip" /></span>
          </div>
        {/each}
      </div>
    {:else}
      <div class="sec" style="padding-top: 26px"><span>Add players in seat order</span></div>
    {/if}

    {#if !full}
      <label class="search">
        <Icon name="search" />
        <input
          bind:this={input}
          bind:value={query}
          onkeydown={onkey}
          placeholder={seats.length ? 'Add another player' : 'Player name'}
          autocomplete="off"
          autocapitalize="words"
          enterkeyhint="done"
          maxlength="24" />
      </label>
    {/if}

    {#if query.trim()}
      <div class="card sugg">
        {#if !exactMatch}
          <button class="lrow" onclick={() => add(query)}>
            <span class="newav"><Icon name="plus" size={18} stroke={2.4} /></span>
            <span class="nm">Add “{query.trim()}”<small>New player</small></span>
          </button>
        {/if}
        {#each suggestions as s (s.player.id)}
          <button class="lrow" onclick={() => addPlayer(s.player)}>
            <Avatar player={s.player} />
            <span class="nm">{s.player.name}<small>{lastPlayed(s)}</small></span>
            <span class="addb"><Icon name="plus" size={16} stroke={2.6} /></span>
          </button>
        {/each}
      </div>
    {:else if recents.length && !full}
      <div class="sec"><span>Recent players</span></div>
      <div class="quick">
        {#each recents as s (s.player.id)}
          <button class="qa" onclick={() => addPlayer(s.player)}><Avatar player={s.player} size={26} />{s.player.name}</button>
        {/each}
      </div>
    {/if}

    <div class="sec"><span>Options</span></div>
    <def.Options bind:options />
  </main>

  <div class="dock">
    <button class="cta" disabled={seats.length < def.minPlayers || starting} onclick={start}>
      {#if seats.length < def.minPlayers}Add at least {def.minPlayers} players{:else}Start game · {seats.length} players<Icon name="next" size={18} stroke={2.4} />{/if}
    </button>
  </div>
</div>

<style>
  .h { font: 800 32px var(--f-ui) !important; letter-spacing: -.02em; color: var(--p-hdr-fg); }
  .seats .lrow { padding: 8px 6px 8px 14px; background: var(--p-surface); position: relative; transition: box-shadow .15s; }
  .seats .lrow:first-child { border-radius: 22px 22px 0 0; }
  .seats .lrow:last-child { border-radius: 0 0 22px 22px; }
  .seats .lrow:only-child { border-radius: 22px; }
  .lifted { z-index: 2; box-shadow: var(--p-shadow-lift); border-radius: 16px !important; transition: none !important; }
  .nm { flex: 1; min-width: 0; font: 700 16px var(--f-ui); text-align: left; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .nm small { display: block; font: 500 12.5px var(--f-ui); color: var(--p-muted); }
  .seatno { font: 700 12px var(--f-ui); color: var(--p-muted); width: 14px; text-align: center; flex: none; }
  .x { width: 36px; height: 36px; display: grid; place-items: center; color: var(--p-muted); border-radius: 50%; flex: none; }
  .grip { width: 44px; height: 44px; display: grid; place-items: center; color: var(--p-muted); touch-action: none; cursor: grab; flex: none; }
  .search {
    display: flex; align-items: center; gap: 10px; height: 54px; border-radius: 16px; padding: 0 14px;
    background: var(--p-surface); box-shadow: var(--p-shadow); color: var(--p-muted);
  }
  .search:focus-within { box-shadow: 0 0 0 2px var(--p-accent), 0 8px 20px -10px var(--p-cta-shadow); }
  .search input { flex: 1; min-width: 0; border: 0; background: none; outline: none; font: 600 17px var(--f-ui); color: var(--p-fg); }
  .search input::placeholder { color: var(--p-muted); font-weight: 500; }
  .sugg .lrow { width: 100%; padding: 10px 14px; }
  .newav { width: 36px; height: 36px; border-radius: 50%; display: grid; place-items: center; background: var(--p-accent-soft); color: var(--p-accent-text); flex: none; }
  .addb { width: 30px; height: 30px; border-radius: 50%; display: grid; place-items: center; background: var(--p-accent-soft); color: var(--p-accent-text); flex: none; }
  .quick { display: flex; gap: 8px; flex-wrap: wrap; padding: 0 2px; }
  .qa { display: flex; align-items: center; gap: 7px; padding: 5px 12px 5px 5px; border-radius: 999px; background: var(--p-surface); box-shadow: var(--p-shadow-sm); font: 700 14px var(--f-ui); }
</style>
