<script lang="ts">
  import Avatar from '../../components/Avatar.svelte';
  import Icon from '../../components/Icon.svelte';
  import Sheet from '../../components/Sheet.svelte';
  import Stepper from '../../components/Stepper.svelte';
  import type { Player, RoundEntryProps } from '../types';
  import { CARD_VALUES, countPoints, isOver, score, type CardCounts, type HeatEntry, type HeatOptions } from './rules';

  let { game, round = $bindable(), players, before, editing, onchange, onnext }: RoundEntryProps<HeatOptions, HeatEntry> = $props();

  const entered = $derived(players.filter((p) => score(round.entries[p.id]) !== null).length);
  const done = $derived(entered === players.length);
  const after = $derived(Object.fromEntries(players.map((p) => [p.id, (before[p.id] ?? 0) + (score(round.entries[p.id]) ?? 0)])));
  const ending = $derived(done && !editing && isOver(game.options, after));

  let counting = $state<Player | null>(null);
  let counts = $state<CardCounts>({});

  function typed(e: HeatEntry, raw: string) {
    const digits = raw.replace(/\D/g, '').slice(0, 3);
    e.value = digits === '' ? null : Number(digits);
    e.cards = null;
    onchange();
  }

  function openCounter(p: Player) {
    counts = { ...(round.entries[p.id].cards ?? {}) };
    counting = p;
  }

  function useCounts() {
    if (!counting) return;
    const e = round.entries[counting.id];
    e.cards = { ...counts };
    e.value = null;
    counting = null;
    onchange();
  }
</script>

<div class="sec" style="padding-top: 26px">
  <span>Points taken this round</span>
  <span class:ok={done}>{entered} of {players.length} entered</span>
</div>

{#each players as p, i (p.id)}
  {@const e = round.entries[p.id]}
  {@const pts = score(e)}
  {@const left = game.options.target - after[p.id]}
  <div class="card pc" class:lift={i === 0}>
    <div class="pc-h">
      <Avatar player={p} />
      <div class="who">
        <span class="nm"><span class="t">{p.name}</span></span>
        <span class="sub num" class:hot={left <= 10}>{left > 0 ? `${left} until ${game.options.target}` : `Reached ${game.options.target}`}</span>
      </div>
      {#if pts !== null}
        <div class="res">
          <span class="delta {pts > 0 ? 'neg' : 'zero'}">{pts > 0 ? `+${pts}` : '0'}</span>
          <span class="to">→ {after[p.id]}</span>
        </div>
      {/if}
    </div>
    <div class="row">
      {#if e.cards}
        <button class="counted" onclick={() => openCounter(p)} aria-label="Edit {p.name}'s cards">
          {#each CARD_VALUES as v}{#if e.cards[v]}<span class="chip">{e.cards[v]}×{v}</span>{/if}{/each}
          <b class="num">{countPoints(e.cards)}</b>
        </button>
      {:else}
        <input class="field num" type="text" inputmode="numeric" placeholder="Points" aria-label="{p.name}'s points"
          value={e.value ?? ''} oninput={(ev) => typed(e, ev.currentTarget.value)} onfocus={(ev) => ev.currentTarget.select()} />
      {/if}
      <button class="zero" aria-label="{p.name} took nothing" onclick={() => { e.value = 0; e.cards = null; onchange(); }}>0</button>
      <button class="cnt" aria-label="Count {p.name}'s cards" onclick={() => openCounter(p)}><Icon name="cards" size={22} /></button>
    </div>
  </div>
{/each}

<div class="dock">
  <button class="cta" disabled={!done} onclick={onnext}>
    {#if editing}Done{:else if ending}Finish game{:else}Next round<Icon name="next" size={18} stroke={2.4} />{/if}
  </button>
</div>

<Sheet open={counting !== null} onclose={() => (counting = null)} label="Count cards">
  {#if counting}
    <div class="sh"><b>{counting.name}'s cards</b><span class="tot num">{countPoints(counts)}</span></div>
    <p class="note">How many cards of each point value did they take?</p>
    <div class="vals">
      {#each CARD_VALUES as v}
        <div class="vrow"><span class="flame">{v}</span><span class="vl">{v === 1 ? 'point' : 'points'} each</span>
          <Stepper value={counts[v] ?? 0} max={40} label="cards worth {v}" onchange={(n) => (counts = { ...counts, [v]: n })} /></div>
      {/each}
    </div>
    <div class="btns"><button class="cta soft" onclick={() => (counting = null)}>Cancel</button><button class="cta" style="flex: 2" onclick={useCounts}>Use {countPoints(counts)}</button></div>
  {/if}
</Sheet>

<style>
  .hot { color: var(--p-bad); font-weight: 700; }
  .row { display: flex; gap: 8px; }
  .field { flex: 1; min-width: 0; height: 52px; border-radius: 14px; border: 0; background: var(--p-track); padding: 0 16px; font: 800 24px var(--f-ui); text-align: right; color: var(--p-fg); outline: none; }
  .field::placeholder { font: 500 15px var(--f-ui); color: var(--p-muted); }
  .field:focus { background: var(--p-surface); box-shadow: 0 0 0 2px var(--p-accent); }
  .zero, .cnt { width: 52px; height: 52px; border-radius: 14px; display: grid; place-items: center; flex: none; font: 800 18px var(--f-ui); background: var(--p-track); color: var(--p-fg); }
  .cnt { background: var(--p-accent-soft); color: var(--p-accent-text); }
  .counted { flex: 1; min-width: 0; min-height: 52px; display: flex; flex-wrap: wrap; align-items: center; gap: 5px; padding: 6px 14px 6px 8px; border-radius: 14px; background: var(--p-track); }
  .counted .chip { background: var(--p-surface); color: var(--p-fg); }
  .counted b { margin-left: auto; font: 800 22px var(--f-ui); }
  .sh { display: flex; justify-content: space-between; align-items: center; }
  .sh b { font: 800 18px var(--f-ui); }
  .tot { font: 400 40px var(--f-heat); color: var(--p-accent-text); line-height: 1; }
  .note { margin: -6px 2px 0; font: 500 13px var(--f-ui); color: var(--p-muted); }
  .vals { display: flex; flex-direction: column; background: var(--p-track); border-radius: 16px; padding: 4px 8px; }
  .vrow { display: flex; align-items: center; gap: 10px; min-height: 52px; }
  .vrow + .vrow { border-top: 1px solid var(--p-hair-strong); }
  .flame { width: 34px; height: 34px; border-radius: 10px; display: grid; place-items: center; background: linear-gradient(160deg, #ff8a3d, #e2432f); color: #fff; font: 400 16px var(--f-heat); }
  .vl { flex: 1; font: 600 14px var(--f-ui); }
  .btns { display: flex; gap: 10px; }
</style>
