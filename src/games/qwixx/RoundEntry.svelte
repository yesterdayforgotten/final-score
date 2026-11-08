<script lang="ts">
  import Avatar from '../../components/Avatar.svelte';
  import Icon from '../../components/Icon.svelte';
  import Stepper from '../../components/Stepper.svelte';
  import Toggle from '../../components/Toggle.svelte';
  import { haptics } from '../../lib/haptics';
  import type { RoundEntryProps } from '../types';
  import QwixxDice from './QwixxDice.svelte';
  import { canMark, COLORS, crosses, gameOver, LAST, lockedBy, lockedRows, MAX_PENALTIES, rowNumbers, rowScore, score, type Color, type QwixxEntry, type QwixxOptions } from './rules';

  let { round = $bindable(), players, editing, onchange, onnext }: RoundEntryProps<QwixxOptions, QwixxEntry> = $props();

  $effect.pre(() => {
    if (!round.data) round.data = { done: false };
  });

  // svelte-ignore state_referenced_locally
  let open = $state<string | null>(players[0]?.id ?? null);
  let showDice = $state(false);

  const entries = $derived(players.map((p) => round.entries[p.id]));
  const locked = $derived(lockedRows(entries));
  const over = $derived(gameOver(entries));

  function tap(e: QwixxEntry, c: Color, pos: number) {
    const marks = e.marks[c];
    const last = marks.length ? Math.max(...marks) : -1;
    if (pos === last) {
      e.marks[c] = marks.filter((m) => m !== pos); // undo the latest cross
      haptics.tap();
    } else if (canMark(e, c, pos, locked.includes(c))) {
      e.marks[c] = [...marks, pos];
      if (pos === LAST) haptics.bonus();
      else haptics.tap();
    } else return;
    onchange();
  }

  function finish() {
    round.data.done = true;
    onchange();
    onnext();
  }
</script>

<div class="card lift dice">
  {#if showDice}
    <QwixxDice {locked} />
    <button class="hide" onclick={() => (showDice = false)}>Hide dice</button>
  {:else}
    <button class="showd" onclick={() => (showDice = true)}><Icon name="cards" size={18} />Roll dice on screen</button>
  {/if}
</div>

{#if locked.length || over}
  <div class="status" class:over>
    {#if over}Game over: {locked.length >= 2 ? 'two rows locked' : 'someone took four penalties'}. Tap Finish game.
    {:else}Locked: {locked.join(', ')}. One more lock ends the game.{/if}
  </div>
{/if}

{#each players as p (p.id)}
  {@const e = round.entries[p.id]}
  {@const isOpen = open === p.id}
  <div class="card sheet" class:open={isOpen}>
    <button class="ph" onclick={() => (open = isOpen ? null : p.id)} aria-expanded={isOpen}>
      <Avatar player={p} />
      <span class="who"><b>{p.name}</b>
        <small class="mini">{#each COLORS as c}<i class={c}>{crosses(e, c)}</i>{/each}{#if e.penalties}<i class="pen">−{e.penalties * 5}</i>{/if}</small>
      </span>
      <span class="tot num">{score(e)}</span>
      <span class="chev" class:up={isOpen}><Icon name="down" size={18} /></span>
    </button>

    {#if isOpen}
      <div class="mode" role="radiogroup" aria-label="How to score {p.name}">
        <button role="radio" aria-checked={e.mode === 'sheet'} class:on={e.mode === 'sheet'} onclick={() => { e.mode = 'sheet'; onchange(); }}>Scoresheet</button>
        <button role="radio" aria-checked={e.mode === 'counts'} class:on={e.mode === 'counts'} onclick={() => { e.mode = 'counts'; onchange(); }}>Enter counts</button>
      </div>

      {#if e.mode === 'sheet'}
        {#each COLORS as c}
          {@const nums = rowNumbers(c)}
          {@const rowLocked = locked.includes(c)}
          <div class="qrow {c}" class:locked={rowLocked}>
            {#each nums as n, pos}
              {@const marked = e.marks[c].includes(pos)}
              {@const ok = marked || canMark(e, c, pos, rowLocked)}
              <button class="cell" class:marked class:skip={!marked && !ok} disabled={!ok}
                aria-label="{c} {n}{marked ? ', crossed' : ''}" aria-pressed={marked} onclick={() => tap(e, c, pos)}>{n}</button>
            {/each}
            <span class="lk" class:on={lockedBy(e, c)} aria-label={lockedBy(e, c) ? `${p.name} locked ${c}` : `${c} lock`}>
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2" fill="currentColor" /><path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="2.4" /></svg>
            </span>
            <span class="rs num">{rowScore(e, c)}</span>
          </div>
        {/each}
      {:else}
        <div class="counts">
          {#each COLORS as c}
            <div class="cr"><span class="dot {c}"></span><span class="cn">{c[0].toUpperCase() + c.slice(1)}<small>{rowScore(e, c)} pts</small></span>
              <Stepper value={e.counts[c]} max={11} label="{c} crosses" onchange={(v) => { e.counts[c] = v; onchange(); }} />
              <Toggle on={e.locked[c]} label="{p.name} locked {c}" onchange={(v) => { e.locked[c] = v; onchange(); }} /></div>
          {/each}
          <p class="hint">Crosses per row, not counting the lock. Switch on a row's lock if this player closed it.</p>
        </div>
      {/if}

      <div class="pens">
        <span>Penalties<small>−5 each</small></span>
        <span class="boxes" role="group" aria-label="{p.name}'s penalties">
          {#each { length: MAX_PENALTIES } as _, k}
            <button class:on={k < e.penalties} aria-label="Penalty {k + 1}" aria-pressed={k < e.penalties}
              onclick={() => { e.penalties = k < e.penalties && k === e.penalties - 1 ? k : k + 1; haptics.tap(); onchange(); }}>{k < e.penalties ? '✕' : ''}</button>
          {/each}
        </span>
      </div>
    {/if}
  </div>
{/each}

<div class="dock">
  <button class="cta" class:soft={!over && !editing} onclick={finish}>
    {#if editing}Done{:else}Finish game{/if}
  </button>
</div>

<style>
  .dice { margin-top: 4px; }
  .showd, .hide { width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 14px; font: 700 14.5px var(--f-ui); color: var(--p-accent-text); }
  .hide { padding: 0 0 12px; font-size: 12.5px; color: var(--p-muted); }
  .status { padding: 10px 14px; border-radius: 16px; background: var(--p-track); font: 600 13.5px var(--f-ui); color: var(--p-fg); }
  .status.over { background: var(--p-gold-soft); color: var(--p-gold-text); font-weight: 800; }
  .sheet { padding: 6px 10px 10px; display: flex; flex-direction: column; gap: 8px; }
  .sheet.open { box-shadow: var(--p-shadow-lift); }
  .ph { display: flex; align-items: center; gap: 10px; padding: 6px 2px 0; width: 100%; text-align: left; }
  .who { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
  .who b { font: 700 16px var(--f-ui); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .mini { display: flex; gap: 4px; }
  .mini i { font: 700 11px var(--f-ui); font-style: normal; min-width: 20px; text-align: center; padding: 1px 5px; border-radius: 6px; color: #fff; }
  .mini .red { background: #e2433a; } .mini .yellow { background: #e0b100; } .mini .green { background: #2fa25a; } .mini .blue { background: #2f6fd6; }
  .mini .pen { background: var(--p-bad-soft); color: var(--p-bad); }
  .tot { font: 800 24px var(--f-ui); }
  .chev { color: var(--p-muted); transition: transform .2s; display: grid; }
  .chev.up { transform: rotate(180deg); }
  .mode { display: grid; grid-template-columns: 1fr 1fr; padding: 3px; gap: 3px; background: var(--p-track); border-radius: 12px; }
  .mode button { height: 32px; border-radius: 9px; font: 600 13px var(--f-ui); color: var(--p-muted); }
  .mode button.on { background: var(--p-thumb); color: var(--p-on-thumb); font-weight: 800; }
  .qrow { display: grid; grid-template-columns: repeat(11, 1fr) 24px 30px; gap: 3px; align-items: center; padding: 4px; border-radius: 10px; }
  .qrow.red { background: #e2433a; } .qrow.yellow { background: #f5c518; } .qrow.green { background: #2fa25a; } .qrow.blue { background: #2f6fd6; }
  .cell { height: 34px; border-radius: 6px; background: rgba(255,255,255,.88); font: 800 12.5px var(--f-ui); color: #22242c; position: relative; padding: 0; font-variant-numeric: tabular-nums; }
  .cell.skip { opacity: .35; }
  .cell.marked { background: rgba(255,255,255,.95); }
  .cell.marked::after { content: '✕'; position: absolute; inset: 0; display: grid; place-items: center; font: 900 22px var(--f-ui); color: #111; }
  .qrow.locked .cell:not(.marked) { opacity: .3; }
  .lk { display: grid; place-items: center; height: 30px; border-radius: 50%; background: rgba(255,255,255,.35); color: rgba(0,0,0,.35); }
  .lk.on { background: #fff; color: #111; }
  .rs { font: 800 13px var(--f-ui); color: #fff; text-align: center; }
  .qrow.yellow .rs { color: #3a2e00; }
  .counts { display: flex; flex-direction: column; background: var(--p-track); border-radius: 14px; padding: 4px 10px; }
  .cr { display: flex; align-items: center; gap: 10px; min-height: 50px; }
  .cr + .cr { border-top: 1px solid var(--p-hair-strong); }
  .dot { width: 14px; height: 14px; border-radius: 4px; flex: none; }
  .dot.red { background: #e2433a; } .dot.yellow { background: #f5c518; } .dot.green { background: #2fa25a; } .dot.blue { background: #2f6fd6; }
  .cn { flex: 1; font: 700 14px var(--f-ui); }
  .cn small { display: block; font: 500 11.5px var(--f-ui); color: var(--p-muted); }
  .hint { margin: 4px 0 6px; font: 500 12px var(--f-ui); color: var(--p-muted); }
  .pens { display: flex; align-items: center; justify-content: space-between; padding: 2px 2px 0; font: 700 14px var(--f-ui); }
  .pens small { display: block; font: 500 11.5px var(--f-ui); color: var(--p-muted); }
  .boxes { display: flex; gap: 6px; }
  .boxes button { width: 36px; height: 36px; border-radius: 8px; border: 2px solid var(--p-hair-strong); font: 900 18px var(--f-ui); color: var(--p-bad); background: var(--p-surface); }
  .boxes button.on { border-color: var(--p-bad); background: var(--p-bad-soft); }
</style>
