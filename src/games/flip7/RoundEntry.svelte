<script lang="ts">
  import Avatar from '../../components/Avatar.svelte';
  import Icon from '../../components/Icon.svelte';
  import { dealerSeat } from '../../lib/engine';
  import { deltaClass, signed } from '../../lib/format';
  import type { Player, RoundEntryProps } from '../types';
  import CardPicker from './CardPicker.svelte';
  import { FLIP7_BONUS, isFlip7, score, type F7Entry, type F7Hand, type F7Options } from './rules';

  let { game, round = $bindable(), players, before, editing, onchange, onnext }: RoundEntryProps<F7Options, F7Entry> = $props();

  const dealer = $derived(dealerSeat(round.index, players.length));
  const entered = $derived(players.filter((p) => score(round.entries[p.id]) !== null).length);
  const done = $derived(entered === players.length);
  const ending = $derived(done && players.some((p) => before[p.id] + (score(round.entries[p.id]) ?? 0) >= game.options.target));

  let picking = $state<Player | null>(null);

  function set(fn: () => void) {
    fn();
    onchange();
  }

  function typed(e: F7Entry, raw: string) {
    const digits = raw.replace(/\D/g, '').slice(0, 3);
    set(() => {
      e.value = digits === '' ? null : Number(digits);
      e.hand = null;
      e.bust = false;
    });
  }

  function useHand(h: F7Hand) {
    const p = picking;
    picking = null;
    if (!p) return;
    const e = round.entries[p.id];
    set(() => {
      e.hand = h.numbers.length || h.mods.length ? h : null;
      e.value = e.hand ? null : 0;
      e.bust = false;
    });
  }
</script>

<div class="sec" style="padding-top: 26px">
  <span>This round</span>
  <span class:ok={done}>{entered} of {players.length} entered</span>
</div>

{#each players as p, i (p.id)}
  {@const e = round.entries[p.id]}
  {@const pts = score(e)}
  <div class="card pc" class:lift={i === 0}>
    <div class="pc-h">
      <Avatar player={p} />
      <div class="who">
        <span class="nm"><span class="t">{p.name}</span>
          {#if i === dealer}<span class="dealer"><Icon name="deal" size={12} stroke={2.4} />Dealer</span>{/if}
          {#if e.hand && isFlip7(e.hand) && !e.bust}<span class="f7bonus">Flip 7 +{FLIP7_BONUS}</span>{/if}
        </span>
      </div>
      {#if pts !== null}
        <div class="res">
          <span class="delta {deltaClass(e.bust ? -1 : pts)}">{e.bust ? '0' : signed(pts)}</span>
          <span class="to">→ {before[p.id] + pts}</span>
        </div>
      {/if}
    </div>
    {#if e.bust}
      <div class="bustbar">Bust<button onclick={() => set(() => (e.bust = false))}>Undo</button></div>
    {:else}
      <div class="f7in">
        {#if e.hand}
          <button class="minis" onclick={() => (picking = p)} aria-label="Edit {p.name}'s cards">
            {#each e.hand.numbers as n}<span class="mc">{n}</span>{/each}
            {#each e.hand.mods as m}<span class="mc mod">+{m}</span>{/each}
            {#if e.hand.x2}<span class="mc mod">×2</span>{/if}
            <span class="htotal num">{pts}</span>
          </button>
        {:else}
          <input
            class="f7field num"
            type="text"
            inputmode="numeric"
            pattern="[0-9]*"
            enterkeyhint="next"
            placeholder="Score"
            aria-label="{p.name}'s score"
            value={e.value ?? ''}
            oninput={(ev) => typed(e, ev.currentTarget.value)}
            onfocus={(ev) => ev.currentTarget.select()} />
        {/if}
        <button class="sq bust" aria-label="{p.name} went bust" onclick={() => set(() => (e.bust = true))}><Icon name="bust" size={22} /></button>
        <button class="sq cards" aria-label="Count {p.name}'s cards" onclick={() => (picking = p)}><Icon name="cards" size={22} /></button>
      </div>
    {/if}
  </div>
{/each}

<div class="dock">
  <button class="cta" disabled={!done} onclick={onnext}>
    {#if editing}Done{:else if ending}Finish game{:else}Next round<Icon name="next" size={18} stroke={2.4} />{/if}
  </button>
</div>

<CardPicker open={picking !== null} player={picking} initial={picking ? round.entries[picking.id].hand : null} onclose={() => (picking = null)} onuse={useHand} />

<style>
  .f7in { display: flex; gap: 8px; }
  .f7field {
    flex: 1; min-width: 0; height: 52px; border-radius: 14px; border: 0; background: var(--p-track);
    padding: 0 16px; font: 800 24px var(--f-ui); text-align: right; color: var(--p-fg); outline: none;
    transition: box-shadow .15s, background .15s;
  }
  .f7field::placeholder { font: 500 15px var(--f-ui); color: var(--p-muted); }
  .f7field:focus { background: var(--p-surface); box-shadow: 0 0 0 2px var(--p-accent); }
  .sq { width: 52px; height: 52px; border-radius: 14px; display: grid; place-items: center; background: var(--p-track); color: var(--p-fg); flex: none; }
  .sq.bust { color: var(--p-bad); }
  .sq.cards { background: var(--p-accent-soft); color: var(--p-accent-text); }
  .bustbar {
    height: 52px; border-radius: 14px; display: flex; align-items: center; justify-content: space-between; padding: 0 8px 0 16px;
    background: var(--p-bad-soft); color: var(--p-bad); font: 800 16px var(--f-ui); letter-spacing: .06em; text-transform: uppercase;
  }
  .bustbar button { font: 700 13px var(--f-ui); letter-spacing: 0; text-transform: none; padding: 8px 14px; border-radius: 10px; background: var(--p-surface); color: var(--p-fg); }
  .minis { flex: 1; min-width: 0; display: flex; gap: 4px; align-items: center; flex-wrap: wrap; min-height: 52px; padding: 4px 12px 4px 4px; border-radius: 14px; background: var(--p-track); }
  .mc { width: 26px; height: 36px; border-radius: 6px; background: var(--p-surface); box-shadow: 0 0 0 1px var(--p-hair-strong); display: grid; place-items: center; font: 700 14px var(--f-f7); color: var(--p-fg); }
  .mc.mod { width: auto; padding: 0 5px; color: var(--p-accent-text); }
  .htotal { margin-left: auto; font: 800 22px var(--f-ui); }
  .f7bonus { font: 700 10.5px var(--f-ui); padding: 3px 8px; border-radius: 999px; background: linear-gradient(90deg, #ffcf3f, #ff9a3d); color: #2a1a3e; letter-spacing: .03em; text-transform: uppercase; flex: none; }
</style>
