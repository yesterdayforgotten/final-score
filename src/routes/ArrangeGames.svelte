<script lang="ts">
  import Band from '../components/Band.svelte';
  import Icon from '../components/Icon.svelte';
  import Toggle from '../components/Toggle.svelte';
  import type { GameDefinition } from '../games/types';
  import { gamePrefs, orderedGames, setHidden, setOrder } from '../lib/gamePrefs.svelte';
  import { back } from '../lib/router.svelte';
  import { BASE_COLOR, setThemeColor } from '../lib/theme';

  setThemeColor(BASE_COLOR);

  let list = $state<GameDefinition[]>(orderedGames());

  // Drag to reorder by the grip (same feel as seat order on the new-game screen).
  let dragging = $state<number | null>(null);
  let dy = $state(0);
  let startY = 0;
  let rowH = 64;

  function dragStart(e: PointerEvent, i: number) {
    rowH = ((e.currentTarget as HTMLElement).closest('.lrow') as HTMLElement).offsetHeight;
    dragging = i;
    startY = e.clientY;
    dy = 0;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function dragMove(e: PointerEvent) {
    if (dragging === null) return;
    dy = e.clientY - startY;
    const target = Math.max(0, Math.min(list.length - 1, dragging + Math.round(dy / rowH)));
    if (target !== dragging) {
      const [g] = list.splice(dragging, 1);
      list.splice(target, 0, g);
      startY += (target - dragging) * rowH;
      dragging = target;
      dy = e.clientY - startY;
    }
  }

  function dragEnd() {
    if (dragging === null) return;
    dragging = null;
    dy = 0;
    setOrder(list.map((g) => g.id));
  }

  function move(i: number, by: number) {
    const j = i + by;
    if (j < 0 || j >= list.length) return;
    const [g] = list.splice(i, 1);
    list.splice(j, 0, g);
    setOrder(list.map((x) => x.id));
  }
</script>

<div class="screen t-base">
  <Band plain onback={() => back('/')}>
    {#snippet title()}<h1 class="h">Arrange games</h1>{/snippet}
  </Band>
  <main class="content flat">
    <p class="intro">Drag to change the order on the home screen. Switch a game off to hide it.</p>
    <div class="card" class:dragging={dragging !== null}>
      {#each list as g, i (g.id)}
        {@const shown = !gamePrefs.hidden.includes(g.id)}
        <div class="lrow" class:lifted={dragging === i} class:off={!shown} style:transform={dragging === i ? `translateY(${dy}px)` : ''}>
          <span class="grip" role="button" tabindex="-1" aria-label="Drag to reorder {g.name}"
            onpointerdown={(e) => dragStart(e, i)} onpointermove={dragMove} onpointerup={dragEnd} onpointercancel={dragEnd}><Icon name="grip" /></span>
          <span class="sw tile-{g.id}" aria-hidden="true"></span>
          <span class="nm nm-{g.id}" style:font-family={g.titleFont}>{g.name}</span>
          <span class="mv">
            <button aria-label="Move {g.name} up" disabled={i === 0} onclick={() => move(i, -1)}><Icon name="down" size={16} class="up" /></button>
            <button aria-label="Move {g.name} down" disabled={i === list.length - 1} onclick={() => move(i, 1)}><Icon name="down" size={16} /></button>
          </span>
          <Toggle on={shown} label="Show {g.name} on the home screen" onchange={(v) => setHidden(g.id, !v)} />
        </div>
      {/each}
    </div>
  </main>
</div>

<style>
  .h { font: 800 32px var(--f-ui) !important; letter-spacing: -.02em; }
  .intro { margin: 0 6px 2px; font: 500 13.5px var(--f-ui); color: var(--p-muted); }
  .lrow { padding: 10px 12px 10px 4px; background: var(--p-surface); position: relative; gap: 10px; }
  .lrow:first-child { border-radius: 22px 22px 0 0; }
  .lrow:last-child { border-radius: 0 0 22px 22px; }
  .lifted { z-index: 2; box-shadow: var(--p-shadow-lift); border-radius: 16px !important; }
  .grip { width: 40px; height: 44px; display: grid; place-items: center; color: var(--p-muted); touch-action: none; cursor: grab; flex: none; }
  .sw { width: 34px; height: 34px; border-radius: 10px; flex: none; }
  .nm { flex: 1; min-width: 0; font-size: 18px; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .nm-beat-the-heat { font-size: 14px; font-weight: 400; }
  .nm-azul { letter-spacing: .05em; }
  .off .nm, .off .sw { opacity: .4; }
  .mv { display: flex; flex: none; }
  .mv button { width: 32px; height: 36px; display: grid; place-items: center; color: var(--p-muted); }
  .mv button:disabled { opacity: .25; }
  .mv :global(.up) { transform: rotate(180deg); }
  .tile-skull-king { background: linear-gradient(140deg, #2c4677, #0d1629); }
  .tile-flip7 { background: linear-gradient(140deg, #ffd34d, #ff7a3d); }
  .tile-bank { background: linear-gradient(140deg, #23966b, #08291e); }
  .tile-herd { background: linear-gradient(140deg, #ffa3cb, #c2256f); }
  .tile-azul { background: linear-gradient(140deg, #5b9cff, #0d2a5c); }
  .tile-beat-the-heat { background: linear-gradient(140deg, #ffd34d, #d0301f); }
  .tile-any { background: linear-gradient(140deg, #7d8cff, #232c80); }
</style>
