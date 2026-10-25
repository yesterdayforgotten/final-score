<script lang="ts">
  import Avatar from '../../components/Avatar.svelte';
  import Sheet from '../../components/Sheet.svelte';
  import type { Player } from '../types';
  import { emptyHand, FLIP7_BONUS, handScore, isFlip7, MODS, NUMBERS, type F7Hand } from './rules';

  let {
    open,
    player,
    initial,
    onclose,
    onuse,
  }: { open: boolean; player: Player | null; initial: F7Hand | null; onclose: () => void; onuse: (h: F7Hand) => void } = $props();

  let hand = $state<F7Hand>(emptyHand());

  // Start from the player's saved hand each time the sheet opens.
  $effect(() => {
    if (open) hand = initial ? structuredClone($state.snapshot(initial)) : emptyHand();
  });

  const total = $derived(handScore(hand));
  const numSum = $derived(hand.numbers.reduce((a, b) => a + b, 0));
  const modSum = $derived(hand.mods.reduce((a, b) => a + b, 0));
  const flip7 = $derived(isFlip7(hand));

  function toggleNum(n: number) {
    if (hand.numbers.includes(n)) hand.numbers = hand.numbers.filter((x) => x !== n);
    else if (hand.numbers.length < 7) hand.numbers = [...hand.numbers, n].sort((a, b) => a - b);
  }

  function toggleMod(m: number) {
    hand.mods = hand.mods.includes(m) ? hand.mods.filter((x) => x !== m) : [...hand.mods, m].sort((a, b) => a - b);
  }
</script>

<Sheet {open} {onclose} label="{player?.name ?? ''}'s cards">
  {#if player}
    <div class="bs-h">
      <Avatar {player} />
      <div class="t">{player.name}'s cards
        <small>{#if flip7}Flip 7! +{FLIP7_BONUS} bonus{:else}{hand.numbers.length} {hand.numbers.length === 1 ? 'number' : 'numbers'} · {7 - hand.numbers.length} more for Flip 7{/if}</small>
      </div>
      <span class="total num">{total}</span>
    </div>
    <div class="prog" aria-hidden="true">{#each { length: 7 } as _, i}<i class:on={i < hand.numbers.length}></i>{/each}</div>
    <div class="deck" role="group" aria-label="Number cards">
      {#each NUMBERS as n}
        {@const on = hand.numbers.includes(n)}
        <button class="pcard num" class:on aria-pressed={on} aria-label={String(n)} data-n={n} disabled={!on && hand.numbers.length >= 7} onclick={() => toggleNum(n)}>{n}</button>
      {/each}
    </div>
    <div class="lbl">Modifiers</div>
    <div class="mods" role="group" aria-label="Modifier cards">
      {#each MODS as m}
        {@const on = hand.mods.includes(m)}
        <button class="mod" class:on aria-pressed={on} onclick={() => toggleMod(m)}>+{m}</button>
      {/each}
      <button class="mod" class:on={hand.x2} aria-pressed={hand.x2} onclick={() => (hand.x2 = !hand.x2)}>×2</button>
    </div>
    <div class="eq num">
      <span>Numbers <b>{numSum}{hand.x2 ? ' ×2' : ''}</b></span>
      <span>+ Mods <b>{modSum}</b></span>
      {#if flip7}<span>+ <b>{FLIP7_BONUS}</b></span>{/if}
      <span>= <b>{total}</b></span>
    </div>
    <div class="row">
      <button class="cta soft" onclick={onclose}>Cancel</button>
      <button class="cta" style="flex: 2" onclick={() => onuse($state.snapshot(hand))}>Use {total}</button>
    </div>
  {/if}
</Sheet>

<style>
  .bs-h { display: flex; align-items: center; gap: 12px; }
  .t { flex: 1; font: 800 18px var(--f-ui); letter-spacing: -.01em; min-width: 0; }
  .t small { display: block; font: 600 12.5px var(--f-ui); color: var(--p-muted); }
  .total { font: 700 44px var(--f-f7); line-height: 1; color: var(--p-accent-text); }
  .prog { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; }
  .prog i { height: 5px; border-radius: 3px; background: var(--p-track); transition: background .2s; }
  .prog i.on { background: linear-gradient(90deg, #14b3ad, #12a19c); }
  .deck { display: grid; grid-template-columns: repeat(7, 1fr); gap: 7px; }
  .pcard {
    aspect-ratio: 5 / 7; border-radius: 10px; background: var(--p-surface); position: relative;
    box-shadow: 0 0 0 1.5px var(--p-hair-strong), 0 2px 4px rgba(0,0,0,.06);
    display: grid; place-items: center; font: 700 21px var(--f-f7); color: var(--p-fg);
    transition: transform .15s ease, background .15s ease;
  }
  .pcard::before { content: attr(data-n); position: absolute; left: 5px; top: 3px; font-size: 9.5px; opacity: .55; }
  .pcard.on { background: linear-gradient(160deg, #19c2bb, #0f9690); color: #fff; box-shadow: 0 8px 14px -6px rgba(15,150,144,.7); transform: translateY(-4px); }
  .pcard:disabled { opacity: .4; }
  .lbl { font: 700 12px var(--f-ui); color: var(--p-muted); letter-spacing: .04em; text-transform: uppercase; margin-bottom: -6px; }
  .mods { display: grid; grid-template-columns: repeat(6, 1fr); gap: 6px; }
  .mod { height: 44px; border-radius: 12px; font: 700 16px var(--f-f7); background: var(--p-track); color: var(--p-accent-text); transition: background .15s; }
  .mod.on { background: linear-gradient(160deg, #ff6a4d, #e8402f); color: #fff; box-shadow: 0 8px 14px -6px rgba(232,64,47,.7); }
  .eq { display: flex; align-items: center; justify-content: space-between; gap: 6px; padding: 10px 14px; border-radius: 14px; background: var(--p-track); font: 600 13.5px var(--f-ui); color: var(--p-muted); }
  .eq b { color: var(--p-fg); font-weight: 800; }
  .row { display: flex; gap: 10px; }
</style>
