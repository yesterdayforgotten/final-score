<script lang="ts">
  import Avatar from '../../components/Avatar.svelte';
  import Icon from '../../components/Icon.svelte';
  import Seg from '../../components/Seg.svelte';
  import Stepper from '../../components/Stepper.svelte';
  import Toggle from '../../components/Toggle.svelte';
  import { haptics } from '../../lib/haptics';
  import { deltaClass, signed } from '../../lib/format';
  import type { RoundEntryProps } from '../types';
  import { colorAt, endBonus, endsGame, floorPenalty, layTiles, SIZE, wallBefore, type AzulEntry, type AzulOptions } from './rules';

  let { game, round = $bindable(), players, before, rounds, editing, onchange, onnext }: RoundEntryProps<AzulOptions, AzulEntry> = $props();

  // A new round keeps each player's chosen mode from the round before.
  $effect.pre(() => {
    if (!round.data) round.data = { done: false };
    if (round.index === 0 || round.data.modesCopied) return;
    const prev = rounds.find((r) => r.index === round.index - 1);
    if (!prev) return;
    for (const p of players) if (prev.entries[p.id]?.mode === 'number') round.entries[p.id].mode = 'number';
    round.data.modesCopied = true;
    onchange();
  });

  const ending = $derived(endsGame(game, rounds, round));
  const walls = $derived(Object.fromEntries(players.map((p) => [p.id, wallBefore(rounds, p.id, round.index)])));
  const CELLS = Array.from({ length: SIZE * SIZE }, (_, i) => i);

  function tapCell(e: AzulEntry, wall: Set<number>, cell: number) {
    if (wall.has(cell)) return;
    if (e.placed.includes(cell)) e.placed = e.placed.filter((c) => c !== cell);
    else {
      // One tile per row each round: a new tap in the same row moves it.
      const row = Math.floor(cell / SIZE);
      e.placed = [...e.placed.filter((c) => Math.floor(c / SIZE) !== row), cell];
    }
    haptics.tap();
    onchange();
  }

  function setMode(e: AzulEntry, m: 'wall' | 'number') {
    e.mode = m;
    onchange();
  }

  function typed(e: AzulEntry, raw: string) {
    const neg = /^\s*[-−]/.test(raw);
    const digits = raw.replace(/\D/g, '').slice(0, 4);
    e.manual = digits === '' ? null : (neg ? -1 : 1) * Number(digits);
    onchange();
  }

  function finish() {
    round.data.done = true;
    onchange();
    onnext();
  }

  const roundPts = (e: AzulEntry) => e.points + e.bonus;
</script>

<div class="sec" style="padding-top: 26px">
  <span>Round {round.index + 1}</span>
  {#if ending}<span class="end">Someone finished a row · last round</span>{:else}<span>Tap the tiles each player placed</span>{/if}
</div>

{#each players as p, i (p.id)}
  {@const e = round.entries[p.id]}
  {@const wall = walls[p.id]}
  <div class="card pc" class:lift={i === 0}>
    <div class="pc-h">
      <Avatar player={p} />
      <div class="who">
        <span class="nm"><span class="t">{p.name}</span></span>
        <span class="sub num">{(before[p.id] ?? 0)} so far</span>
      </div>
      <div class="res">
        <span class="delta {deltaClass(roundPts(e))}">{signed(roundPts(e))}</span>
        <span class="to">→ {Math.max(0, (before[p.id] ?? 0) + roundPts(e))}</span>
      </div>
    </div>

    <div class="mode" role="radiogroup" aria-label="How to score {p.name}">
      <button role="radio" aria-checked={e.mode === 'wall'} class:on={e.mode === 'wall'} onclick={() => setMode(e, 'wall')}>Tap tiles</button>
      <button role="radio" aria-checked={e.mode === 'number'} class:on={e.mode === 'number'} onclick={() => setMode(e, 'number')}>Type a number</button>
    </div>

    {#if e.mode === 'wall'}
      {@const after = layTiles(wall, e.placed).wall}
      <div class="wall" role="grid" aria-label="{p.name}'s wall">
        {#each CELLS as c}
          {@const had = wall.has(c)}
          {@const now = e.placed.includes(c)}
          <button
            class="tile {colorAt(c)}"
            class:had
            class:now
            disabled={had}
            aria-label="Row {Math.floor(c / SIZE) + 1}, {colorAt(c)}{had ? ', already placed' : now ? ', placed this round' : ''}"
            aria-pressed={now}
            onclick={() => tapCell(e, wall, c)}></button>
        {/each}
      </div>
      <div class="floorl"><span>Floor tiles</span><span class="pen num">{e.floor ? floorPenalty(e.floor) : 'none'}</span></div>
      <Seg max={7} value={e.floor} label="{p.name}'s floor tiles" onselect={(v) => { e.floor = v; onchange(); }} />
      {#if e.bonus}
        {@const b = endBonus(after)}
        <p class="bonus">End bonus <b>+{b.total}</b>: {b.rows} {b.rows === 1 ? 'row' : 'rows'}, {b.cols} {b.cols === 1 ? 'column' : 'columns'}, {b.colors} {b.colors === 1 ? 'colour' : 'colours'}</p>
      {/if}
    {:else}
      <input class="field num" type="text" inputmode="numeric" placeholder="Points this round" aria-label="{p.name}'s points"
        value={e.manual === null ? '' : e.manual < 0 ? `-${-e.manual}` : e.manual} oninput={(ev) => typed(e, ev.currentTarget.value)} />
      <div class="rowdone"><span>Finished a horizontal row</span><Toggle on={e.rowDone} label="{p.name} finished a row" onchange={(v) => { e.rowDone = v; onchange(); }} /></div>
      {#if ending}
        <div class="bon">
          <div><span>Full rows<small>+2 each</small></span><Stepper value={e.bonusRows} max={5} label="full rows" onchange={(v) => { e.bonusRows = v; onchange(); }} /></div>
          <div><span>Full columns<small>+7 each</small></span><Stepper value={e.bonusCols} max={5} label="full columns" onchange={(v) => { e.bonusCols = v; onchange(); }} /></div>
          <div><span>Complete colours<small>+10 each</small></span><Stepper value={e.bonusColors} max={5} label="complete colours" onchange={(v) => { e.bonusColors = v; onchange(); }} /></div>
        </div>
      {/if}
    {/if}
  </div>
{/each}

<div class="dock">
  <button class="cta" onclick={finish}>
    {#if editing}Done{:else if ending}Finish game{:else}Next round<Icon name="next" size={18} stroke={2.4} />{/if}
  </button>
</div>

<style>
  .end { color: var(--p-accent-text); font-weight: 800; }
  .mode { display: grid; grid-template-columns: 1fr 1fr; padding: 3px; gap: 3px; background: var(--p-track); border-radius: 12px; }
  .mode button { height: 32px; border-radius: 9px; font: 600 13px var(--f-ui); color: var(--p-muted); }
  .mode button.on { background: var(--p-thumb); color: var(--p-on-thumb); font-weight: 800; box-shadow: 0 2px 6px rgba(0,0,0,.12); }
  .wall { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; padding: 10px; border-radius: 16px; background: var(--p-track); max-width: 320px; width: 100%; align-self: center; }
  .tile { aspect-ratio: 1; border-radius: 9px; position: relative; opacity: .22; transition: opacity .12s, transform .12s; border: 0; }
  .tile.had { opacity: 1; box-shadow: inset 0 -3px 0 rgba(0,0,0,.18); }
  .tile.now { opacity: 1; transform: scale(1.04); box-shadow: 0 0 0 3px var(--p-surface), 0 0 0 5px var(--p-accent), inset 0 -3px 0 rgba(0,0,0,.18); }
  .tile.now::after { content: ''; position: absolute; inset: 30%; border-radius: 50%; background: rgba(255,255,255,.85); }
  .tile.blue { background: linear-gradient(145deg, #3c82e6, #1f5fbf); }
  .tile.yellow { background: linear-gradient(145deg, #ffd34f, #e5a91c); }
  .tile.red { background: linear-gradient(145deg, #ef5a4c, #c23529); }
  .tile.black { background: linear-gradient(145deg, #4a4a57, #22222a); }
  .tile.teal { background: linear-gradient(145deg, #e9f6f7, #9fd6da); }
  .floorl { display: flex; justify-content: space-between; font: 700 13px var(--f-ui); color: var(--p-muted); padding: 0 2px; margin-bottom: -4px; }
  .pen { color: var(--p-bad); }
  .bonus { margin: 0; font: 600 13px var(--f-ui); color: var(--p-muted); }
  .bonus b { color: var(--p-good); }
  .field { height: 52px; border-radius: 14px; border: 0; background: var(--p-track); padding: 0 16px; font: 800 22px var(--f-ui); text-align: right; color: var(--p-fg); outline: none; }
  .field::placeholder { font: 500 15px var(--f-ui); color: var(--p-muted); }
  .field:focus { background: var(--p-surface); box-shadow: 0 0 0 2px var(--p-accent); }
  .rowdone { display: flex; justify-content: space-between; align-items: center; font: 600 14px var(--f-ui); }
  .bon { display: flex; flex-direction: column; gap: 4px; background: var(--p-track); border-radius: 14px; padding: 6px 10px; }
  .bon div { display: flex; justify-content: space-between; align-items: center; min-height: 44px; font: 600 14px var(--f-ui); }
  .bon small { display: block; font: 500 11.5px var(--f-ui); color: var(--p-muted); }
</style>
