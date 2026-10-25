<script lang="ts">
  import Avatar from '../../components/Avatar.svelte';
  import Icon from '../../components/Icon.svelte';
  import { dealerSeat } from '../../lib/engine';
  import { deltaClass, signed } from '../../lib/format';
  import type { RoundEntryProps } from '../types';
  import { isOver, type AnyEntry, type AnyOptions } from './rules';

  let { game, round = $bindable(), players, before, editing, onchange, onnext }: RoundEntryProps<AnyOptions, AnyEntry> = $props();

  // Players who tapped ± before typing: their next number is negative.
  let negNext = $state<Record<string, boolean>>({});

  const entered = $derived(players.filter((p) => round.entries[p.id].value !== null).length);
  const done = $derived(entered === players.length);
  const after = $derived(Object.fromEntries(players.map((p) => [p.id, (before[p.id] ?? 0) + (round.entries[p.id].value ?? 0)])));
  const ending = $derived(done && !editing && isOver(game.options, round.index + 1, after));
  const dealer = $derived(dealerSeat(round.index, players.length));

  function typed(pid: string, raw: string) {
    const e = round.entries[pid];
    const neg = raw.trim().startsWith('-') || raw.trim().startsWith('−') || (negNext[pid] && e.value === null);
    const digits = raw.replace(/\D/g, '').slice(0, 6);
    e.value = digits === '' ? null : (neg ? -1 : 1) * Number(digits);
    if (digits !== '') negNext[pid] = false;
    onchange();
  }

  function flip(pid: string) {
    const e = round.entries[pid];
    if (e.value === null || e.value === 0) negNext[pid] = !negNext[pid];
    else {
      e.value = -e.value;
      onchange();
    }
  }

  const shown = (pid: string) => {
    const v = round.entries[pid].value;
    return v === null ? (negNext[pid] ? '−' : '') : v < 0 ? `−${-v}` : String(v);
  };
</script>

<div class="sec" style="padding-top: 26px">
  <span>Round {round.index + 1} scores</span>
  <span class:ok={done}>{entered} of {players.length} entered</span>
</div>

{#each players as p, i (p.id)}
  {@const e = round.entries[p.id]}
  <div class="card pc" class:lift={i === 0}>
    <div class="pc-h">
      <Avatar player={p} />
      <div class="who">
        <span class="nm"><span class="t">{p.name}</span>
          {#if i === dealer}<span class="dealer"><Icon name="deal" size={12} stroke={2.4} />Dealer</span>{/if}
        </span>
        <span class="sub num">{(before[p.id] ?? 0).toLocaleString()} so far</span>
      </div>
      {#if e.value !== null}
        <div class="res">
          <span class="delta {deltaClass(game.options.lowWins ? -e.value : e.value)}">{signed(e.value)}</span>
          <span class="to">→ {after[p.id].toLocaleString()}</span>
        </div>
      {/if}
    </div>
    <div class="row">
      <button class="pm" class:neg={(e.value ?? 0) < 0 || negNext[p.id]} aria-label="Make {p.name}'s score negative or positive" onclick={() => flip(p.id)}>±</button>
      <input
        class="field num"
        type="text"
        inputmode="numeric"
        enterkeyhint="next"
        placeholder="Score"
        aria-label="{p.name}'s score"
        value={shown(p.id)}
        oninput={(ev) => typed(p.id, ev.currentTarget.value)}
        onfocus={(ev) => ev.currentTarget.select()} />
    </div>
  </div>
{/each}

{#if game.options.end === 'open'}
  <p class="hint">No set end: after the last round's scores are in, choose ⋯ → End game now.</p>
{/if}

<div class="dock">
  <button class="cta" disabled={!done} onclick={onnext}>
    {#if editing}Done{:else if ending}Finish game{:else}Next round<Icon name="next" size={18} stroke={2.4} />{/if}
  </button>
</div>

<style>
  .row { display: flex; gap: 8px; }
  .pm { width: 52px; height: 52px; border-radius: 14px; background: var(--p-track); font: 700 22px var(--f-ui); color: var(--p-muted); flex: none; }
  .pm.neg { background: var(--p-bad-soft); color: var(--p-bad); }
  .field {
    flex: 1; min-width: 0; height: 52px; border-radius: 14px; border: 0; background: var(--p-track);
    padding: 0 16px; font: 800 24px var(--f-ui); text-align: right; color: var(--p-fg); outline: none;
  }
  .field::placeholder { font: 500 15px var(--f-ui); color: var(--p-muted); }
  .field:focus { background: var(--p-surface); box-shadow: 0 0 0 2px var(--p-accent); }
  .hint { margin: 2px 6px 0; font: 500 12.5px var(--f-ui); color: var(--p-muted); line-height: 1.5; }
</style>
