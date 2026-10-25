<script lang="ts">
  import Avatar from '../../components/Avatar.svelte';
  import Dice from '../../components/Dice.svelte';
  import Icon from '../../components/Icon.svelte';
  import type { RoundEntryProps } from '../types';
  import { bankState, rollerSeat, rollFromDice, rollLabel, SAFE_ROLLS, type BankEntry, type BankOptions, type Roll } from './rules';

  let { game, round = $bindable(), players, before, editing, onchange, onnext }: RoundEntryProps<BankOptions, BankEntry> = $props();

  const MODE_KEY = 'fs.bank.dice';
  let mode = $state<'dice' | 'keypad'>(readMode());
  let faces = $state<[number, number]>([3, 4]);

  function readMode(): 'dice' | 'keypad' {
    try {
      return localStorage.getItem(MODE_KEY) === 'dice' ? 'dice' : 'keypad';
    } catch {
      return 'keypad';
    }
  }

  function setMode(m: 'dice' | 'keypad') {
    mode = m;
    try {
      localStorage.setItem(MODE_KEY, m);
    } catch {
      /* private mode */
    }
  }

  const rolls = $derived<Roll[]>(round.data?.rolls ?? []);
  const st = $derived(bankState(rolls));
  const entries = $derived(players.map((p) => round.entries[p.id]));
  const allBanked = $derived(entries.every((e) => e.banked !== null));
  const over = $derived(st.sevened || allBanked);
  const safe = $derived(st.count < SAFE_ROLLS);
  const nextRoll = $derived(st.count + 1);
  const banked = $derived(players.filter((p) => round.entries[p.id].banked !== null));
  const roller = $derived(over ? null : players[rollerSeat(round.index, entries, st.count)]);
  const upNext = $derived(over ? null : players[rollerSeat(round.index, entries, st.count + 1)]);

  function changed() {
    onchange();
  }

  function addRoll(r: Roll) {
    if (over) return;
    round.data ??= { rolls: [] };
    round.data.rolls = [...rolls, r];
    if (bankState(round.data.rolls).sevened) {
      for (const p of players) {
        const e = round.entries[p.id];
        if (e.banked === null) e.busted = true;
      }
      navigator.vibrate?.([30, 60, 30]);
    }
    changed();
  }

  function undo() {
    if (!rolls.length) return;
    const left = rolls.slice(0, -1);
    round.data.rolls = left;
    for (const p of players) {
      const e = round.entries[p.id];
      e.busted = false;
      if (e.at !== null && e.at > left.length) {
        e.banked = null;
        e.at = null;
      }
    }
    if (left.length) faces = left[left.length - 1].dice ?? faces;
    changed();
  }

  function toggleBank(e: BankEntry) {
    if (st.sevened) return;
    if (e.banked !== null) {
      // Only the most recent decision can be taken back.
      if (e.at === st.count) {
        e.banked = null;
        e.at = null;
        changed();
      }
      return;
    }
    if (st.bank <= 0) return;
    e.banked = st.bank;
    e.at = st.count;
    navigator.vibrate?.(12);
    changed();
  }

  const KEYS = [2, 3, 4, 5, 6, 8, 9, 10, 11, 12];
</script>

{#if roller}
  <div class="turn" aria-live="polite">
    <Avatar player={roller} size={46} />
    <div class="tw">
      <small>Roll {nextRoll}{safe ? ' · safe' : ''}</small>
      <b>{roller.name}'s roll</b>
    </div>
    {#if upNext && upNext.id !== roller.id}<span class="nx">Next<br /><em>{upNext.name}</em></span>{/if}
  </div>
{/if}

<div class="card bankcard" class:lift={!roller} class:bust={st.sevened}>
  <span class="lbl">{st.sevened ? 'Seven! Bank lost' : 'Bank'}</span>
  <span class="amt num">{st.bank.toLocaleString()}</span>
  <span class="hint">
    {#if st.sevened}Round over · {banked.length ? `${banked.length} banked in time` : 'nobody banked'}
    {:else if allBanked}Everyone banked · round over
    {:else if safe}Roll {nextRoll} of {SAFE_ROLLS} safe rolls · 7 is worth +70
    {:else}Roll {nextRoll} · doubles double it · 7 ends the round{/if}
  </span>
  {#if rolls.length}
    <div class="hist" aria-label="Rolls this round">
      {#each rolls as r, i}<span class="rc" class:seven={i >= SAFE_ROLLS && r.sum === 7} class:dbl={i >= SAFE_ROLLS && r.doubles}>{rollLabel(r, i)}</span>{/each}
    </div>
  {/if}
</div>

<div class="sec"><span>{over ? 'This round' : 'Tap a player to bank'}</span><span>{banked.length} of {players.length} banked</span></div>
<div class="grid">
  {#each players as p (p.id)}
    {@const e = round.entries[p.id]}
    <button class="pl card" class:rolling={roller?.id === p.id} class:in={e.banked !== null} class:out={e.busted} disabled={st.sevened || (e.banked === null && st.bank <= 0) || (e.banked !== null && e.at !== st.count)} onclick={() => toggleBank(e)}>
      <Avatar player={p} size={34} />
      <span class="who">
        <span class="nm">{p.name}{#if roller?.id === p.id}<span class="dice-tag">Rolling</span>{/if}</span>
        <span class="st num">
          {#if e.banked !== null}<Icon name="check" size={13} stroke={3} />+{e.banked.toLocaleString()}
          {:else if e.busted}Busted
          {:else}{(before[p.id] ?? 0).toLocaleString()} total{/if}
        </span>
      </span>
    </button>
  {/each}
</div>

<div class="spacer" aria-hidden="true"></div>

<div class="pad">
  {#if over}
    <div class="sum">
      {#if banked.length}
        {#each banked as p (p.id)}<span class="won"><Avatar player={p} size={22} />+{round.entries[p.id].banked?.toLocaleString()}</span>{/each}
      {:else}<span class="none">No points this round</span>{/if}
    </div>
    <div class="row">
      {#if st.sevened}<button class="cta alt" aria-label="Undo the 7" onclick={undo}><Icon name="back" size={18} stroke={2.4} /></button>{/if}
      <button class="cta" onclick={onnext}>
        {#if editing}Done{:else if round.index + 1 >= game.options.rounds}Finish game{:else}Next round<Icon name="next" size={18} stroke={2.4} />{/if}
      </button>
    </div>
  {:else}
    <div class="bar">
      <div class="mode" role="radiogroup" aria-label="Dice">
        <button role="radio" aria-checked={mode === 'dice'} class:on={mode === 'dice'} onclick={() => setMode('dice')}>On-screen dice</button>
        <button role="radio" aria-checked={mode === 'keypad'} class:on={mode === 'keypad'} onclick={() => setMode('keypad')}>My dice</button>
      </div>
      <button class="undo" disabled={!rolls.length} onclick={undo}><Icon name="repeat" size={15} stroke={2.4} />Undo</button>
    </div>
    {#if mode === 'dice'}
      <Dice bind:faces onroll={(a, b) => addRoll(rollFromDice(a, b))} />
      <p class="tap">Tap the dice to roll</p>
    {:else}
      <div class="keys">
        {#each KEYS as k}
          {@const onlyDoubles = !safe && (k === 2 || k === 12)}
          <button class="key num" disabled={onlyDoubles} aria-label={onlyDoubles ? `${k} is always doubles: use Doubles` : String(k)} onclick={() => addRoll({ sum: k, doubles: false })}>{k}</button>
        {/each}
      </div>
      <div class="keys2">
        <button class="key seven" class:safe onclick={() => addRoll({ sum: 7, doubles: false })}>7{safe ? ' · +70' : ''}</button>
        <button class="key dbl" disabled={safe} onclick={() => addRoll({ sum: 0, doubles: true })}>{safe ? 'Doubles: tap the total' : 'Doubles ×2'}</button>
      </div>
    {/if}
  {/if}
</div>

<style>
  .turn {
    margin-top: 4px; display: flex; align-items: center; gap: 12px; padding: 12px 16px 12px 12px; border-radius: 22px;
    background: var(--p-cta); color: var(--p-on-cta); box-shadow: var(--p-shadow-lift);
  }
  .turn :global(.av) { box-shadow: 0 0 0 3px var(--p-gold); }
  .tw { flex: 1; min-width: 0; display: flex; flex-direction: column; }
  .tw small { font: 700 11.5px var(--f-ui); letter-spacing: .1em; text-transform: uppercase; opacity: .7; }
  .tw b { font: 800 22px var(--f-ui); letter-spacing: -.02em; line-height: 1.15; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .nx { font: 600 11.5px var(--f-ui); text-align: right; opacity: .75; line-height: 1.25; flex: none; }
  .nx em { font-style: normal; font-weight: 800; font-size: 14px; opacity: 1; }
  .pl.rolling { box-shadow: inset 0 0 0 2px var(--p-gold), var(--p-shadow); }
  .dice-tag { margin-left: 6px; font: 800 10px var(--f-ui); letter-spacing: .06em; text-transform: uppercase; padding: 2px 6px; border-radius: 999px; background: var(--p-gold-soft); color: var(--p-gold-text); vertical-align: 2px; }
  .key:disabled { opacity: .3; }
  .bankcard { margin-top: 0; padding: 18px 16px 16px; display: flex; flex-direction: column; align-items: center; gap: 2px; text-align: center; }
  .lbl { font: 700 12px var(--f-ui); letter-spacing: .14em; text-transform: uppercase; color: var(--p-muted); }
  .amt { font: 400 60px var(--f-bank); line-height: 1.05; color: var(--p-accent-text); letter-spacing: .01em; }
  .bust .amt { color: var(--p-bad); }
  .hint { font: 600 13px var(--f-ui); color: var(--p-muted); }
  .hist { display: flex; flex-wrap: wrap; justify-content: center; gap: 5px; margin-top: 10px; }
  .rc { font: 700 12px var(--f-ui); padding: 3px 8px; border-radius: 999px; background: var(--p-track); color: var(--p-fg); font-variant-numeric: tabular-nums; }
  .rc.dbl { background: var(--p-gold-soft); color: var(--p-gold-text); }
  .rc.seven { background: var(--p-bad-soft); color: var(--p-bad); }
  .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
  .pl { display: flex; align-items: center; gap: 10px; padding: 10px 12px; text-align: left; border-radius: 18px; transition: background .15s, box-shadow .15s; min-height: 60px; }
  .pl:disabled { cursor: default; }
  .pl.in { background: var(--p-good-soft); box-shadow: inset 0 0 0 1.5px var(--p-good); }
  .pl.out { opacity: .55; }
  .who { min-width: 0; display: flex; flex-direction: column; }
  .nm { font: 700 15px var(--f-ui); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .st { font: 600 12.5px var(--f-ui); color: var(--p-muted); display: flex; align-items: center; gap: 3px; }
  .in .st { color: var(--p-good); font-weight: 800; }
  .out .st { color: var(--p-bad); }
  .spacer { height: 190px; }

  .pad {
    position: fixed; left: 0; right: 0; bottom: 0; z-index: 3;
    padding: 12px var(--gutter-r) calc(14px + var(--safe-bottom)) var(--gutter-l);
    background: var(--p-surface); border-radius: 26px 26px 0 0; box-shadow: 0 -12px 30px -16px rgba(0,0,0,.35);
    display: flex; flex-direction: column; gap: 10px;
  }
  .bar { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
  .mode { display: grid; grid-template-columns: 1fr 1fr; padding: 3px; gap: 3px; background: var(--p-track); border-radius: 12px; }
  .mode button { height: 32px; padding: 0 12px; border-radius: 9px; font: 600 13px var(--f-ui); color: var(--p-muted); white-space: nowrap; }
  .mode button.on { background: var(--p-thumb); color: var(--p-on-thumb); font-weight: 800; box-shadow: 0 2px 6px rgba(0,0,0,.12); }
  .undo { display: flex; align-items: center; gap: 5px; font: 700 13.5px var(--f-ui); color: var(--p-accent-text); padding: 8px 6px; }
  .undo:disabled { opacity: .35; }
  .tap { margin: -6px 0 0; text-align: center; font: 600 12.5px var(--f-ui); color: var(--p-muted); }
  .keys { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; }
  .keys2 { display: grid; grid-template-columns: 1fr 2fr; gap: 6px; }
  .key { height: 48px; border-radius: 13px; background: var(--p-track); font: 700 19px var(--f-ui); color: var(--p-fg); }
  .key:active { transform: scale(.96); }
  .key.seven { background: var(--p-bad-soft); color: var(--p-bad); font-size: 16px; }
  .key.seven.safe { background: var(--p-gold-soft); color: var(--p-gold-text); }
  .key.dbl { background: var(--p-accent-soft); color: var(--p-accent-text); font-size: 15px; }
  .key.dbl:disabled { opacity: .55; font-size: 13px; }
  .sum { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; }
  .won { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px 4px 4px; border-radius: 999px; background: var(--p-good-soft); color: var(--p-good); font: 800 14px var(--f-ui); font-variant-numeric: tabular-nums; }
  .none { font: 600 14px var(--f-ui); color: var(--p-muted); }
  .row { display: flex; gap: 10px; }
</style>
