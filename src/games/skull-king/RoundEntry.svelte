<script lang="ts">
  import Avatar from '../../components/Avatar.svelte';
  import Icon from '../../components/Icon.svelte';
  import Seg from '../../components/Seg.svelte';
  import Stepper from '../../components/Stepper.svelte';
  import Toggle from '../../components/Toggle.svelte';
  import { dealerSeat } from '../../lib/engine';
  import { deltaClass, signed } from '../../lib/format';
  import type { RoundEntryProps } from '../types';
  import { bonusCounts, bonusPoints, cardsDealt, roundCount, score, type SkEntry, type SkOptions } from './rules';

  let { game, round = $bindable(), players, before, editing, onchange, onnext }: RoundEntryProps<SkOptions, SkEntry> = $props();

  const n = $derived(cardsDealt(round.index, game.options));
  const rascal = $derived(game.options.scoring === 'rascal');
  const phase = $derived(round.phase === 'tricks' ? 'tricks' : 'bids');
  const dealer = $derived(dealerSeat(round.index, players.length));
  const order = $derived(players.map((_, i) => players[(dealer + 1 + i) % players.length]));
  const entries = $derived(order.map((p) => round.entries[p.id]));
  const bidsDone = $derived(entries.every((e) => e.bid !== null));
  const tricksDone = $derived(entries.every((e) => e.tricks !== null));
  const bidSum = $derived(entries.reduce((a, e) => a + (e.bid ?? 0), 0));
  const trickSum = $derived(entries.reduce((a, e) => a + (e.tricks ?? 0), 0));

  let open = $state<Record<string, boolean>>({});

  function set(fn: () => void) {
    fn();
    onchange();
  }

  // Once the entered tricks account for every card, anyone still blank took none.
  function setTricks(e: SkEntry, v: number) {
    e.tricks = v;
    const all = players.map((p) => round.entries[p.id]);
    const sum = all.reduce((a, x) => a + (x.tricks ?? 0), 0);
    if (sum >= n) for (const x of all) if (x.tricks === null) x.tricks = 0;
  }

  function setPhase(p: 'bids' | 'tricks') {
    set(() => (round.phase = p));
    document.querySelector('.content')?.scrollTo({ top: 0 });
  }

  function bonusSummary(e: SkEntry): string[] {
    const b = e.bonus;
    const out: string[] = [];
    if (b.std14) out.push(`14 ×${b.std14}`);
    if (b.black14) out.push('Black 14');
    if (b.mermaids) out.push(`Mermaid ×${b.mermaids}`);
    if (b.pirates) out.push(`Pirate ×${b.pirates}`);
    if (b.skullKing) out.push('Skull King');
    if (b.loot) out.push(`Loot ×${b.loot}`);
    return out;
  }
</script>

{#if phase === 'bids'}
  <div class="sec" style="padding-top: 26px">
    <span>Bids · {n} {n === 1 ? 'card' : 'cards'}</span>
    <span class:ok={bidsDone}>Bids total {bidSum} of {n}</span>
  </div>
  {#each order as p, i (p.id)}
    {@const e = round.entries[p.id]}
    <div class="card pc" class:lift={i === 0}>
      <div class="pc-h">
        <Avatar player={p} />
        <div class="who">
          <span class="nm"><span class="t">{p.name}</span>
            {#if players.indexOf(p) === dealer}<span class="dealer"><Icon name="deal" size={12} stroke={2.4} />Dealer</span>{/if}
          </span>
          {#if i === 0}<span class="sub">Bids first</span>{/if}
        </div>
        <span class="val num" class:none={e.bid === null}>{e.bid ?? '–'}</span>
      </div>
      <Seg max={n} value={e.bid} label="{p.name}'s bid" onselect={(v) => set(() => (e.bid = v))} />
      {#if rascal}
        <div class="cannon">
          <span><Icon name="bomb" size={16} />Cannonball<small>{e.cannonball ? `${15 * n} if exact, else 0` : `Grapeshot: ${10 * n}, half if off by one`}</small></span>
          <Toggle on={e.cannonball} label="Cannonball for {p.name}" onchange={(v) => set(() => (e.cannonball = v))} />
        </div>
      {/if}
    </div>
  {/each}
  <div class="dock">
    <button class="cta" disabled={!bidsDone} onclick={() => setPhase('tricks')}>Enter tricks<Icon name="next" size={18} stroke={2.4} /></button>
  </div>
{:else}
  <div class="sec" style="padding-top: 26px">
    <span>Tricks taken</span>
    {#if tricksDone && trickSum === n}
      <span class="ok"><Icon name="check" size={15} stroke={2.6} />{trickSum} of {n}</span>
    {:else if trickSum > n}
      <span class="warn">{trickSum} of {n}: too many</span>
    {:else}
      <span>{trickSum} of {n}</span>
    {/if}
  </div>
  {#each order as p, i (p.id)}
    {@const e = round.entries[p.id]}
    {@const pts = score(e, round.index, game.options)}
    {@const counts = bonusCounts(e, game.options)}
    {@const bp = bonusPoints(e.bonus)}
    <div class="card pc" class:lift={i === 0}>
      <div class="pc-h">
        <Avatar player={p} />
        <div class="who">
          <span class="nm"><span class="t">{p.name}</span>
            {#if players.indexOf(p) === dealer}<span class="dealer"><Icon name="deal" size={12} stroke={2.4} />Dealer</span>{/if}
          </span>
          <span class="sub">Bid {e.bid}{e.cannonball ? ' · Cannonball' : ''}{pts !== null && e.tricks !== e.bid ? (pts > 0 ? ' · off by one' : ' · missed') : ''}</span>
        </div>
        {#if pts !== null}
          <div class="res">
            <span class="delta {deltaClass(pts)}">{signed(pts)}</span>
            <span class="to">→ {before[p.id] + pts}</span>
          </div>
        {/if}
      </div>
      <Seg max={n} value={e.tricks} mark={e.bid} label="{p.name}'s tricks" onselect={(v) => set(() => setTricks(e, v))} />
      {#if counts}
        {@const tags = bonusSummary(e)}
        <button class="disc" aria-expanded={!!open[p.id]} onclick={() => (open[p.id] = !open[p.id])}>
          <span class="sum">
            {#if tags.length}{#each tags as t}<span class="tagc">{t}</span>{/each}{:else}Bonuses{/if}
          </span>
          <span class="pts" class:none={!bp}>{bp ? `+${rascal && e.tricks !== e.bid ? bp / 2 : bp}` : 'None'}</span>
          <span class="chev" class:up={open[p.id]}><Icon name="down" size={16} /></span>
        </button>
        {#if open[p.id]}
          <div class="blist">
            <div class="br"><span class="w">Standard 14s<small>+10 each</small></span>
              <Stepper value={e.bonus.std14} max={3} label="standard 14s" onchange={(v) => set(() => (e.bonus.std14 = v))} /></div>
            <div class="br"><span class="w">Black 14<small>+20</small></span>
              <Toggle on={e.bonus.black14} label="Black 14" onchange={(v) => set(() => (e.bonus.black14 = v))} /></div>
            <div class="br"><span class="w">Mermaids taken by a pirate<small>+20 each</small></span>
              <Stepper value={e.bonus.mermaids} max={2} label="mermaids" onchange={(v) => set(() => (e.bonus.mermaids = v))} /></div>
            <div class="br"><span class="w">Pirates taken by Skull King<small>+30 each</small></span>
              <Stepper value={e.bonus.pirates} max={6} label="pirates" onchange={(v) => set(() => (e.bonus.pirates = v))} /></div>
            <div class="br"><span class="w">Took the Skull King with a mermaid<small>+40</small></span>
              <Toggle on={e.bonus.skullKing} label="Skull King taken" onchange={(v) => set(() => (e.bonus.skullKing = v))} /></div>
            <div class="br"><span class="w">Loot alliances<small>+20 each, if both made their bid</small></span>
              <Stepper value={e.bonus.loot} max={2} label="loot alliances" onchange={(v) => set(() => (e.bonus.loot = v))} /></div>
          </div>
        {/if}
      {/if}
    </div>
  {/each}
  <div class="dock">
    <button class="cta alt" aria-label="Back to bids" onclick={() => setPhase('bids')}><Icon name="back" size={18} stroke={2.4} /></button>
    <button class="cta" disabled={!tricksDone} onclick={onnext}>
      {#if editing}Done{:else if round.index + 1 >= roundCount(game.options)}Finish game{:else}Next round<Icon name="next" size={18} stroke={2.4} />{/if}
    </button>
  </div>
{/if}

<style>
  .cannon { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 9px 2px 0; border-top: 1px solid var(--p-hair); }
  .cannon > span { display: flex; flex-wrap: wrap; align-items: center; gap: 2px 6px; font: 600 14px var(--f-ui); }
  .cannon small { flex-basis: 100%; font: 500 12px var(--f-ui); color: var(--p-muted); }
  .disc { display: flex; align-items: center; gap: 8px; padding: 9px 2px 0; border-top: 1px solid var(--p-hair); font: 600 13.5px var(--f-ui); color: var(--p-muted); width: 100%; text-align: left; }
  .sum { flex: 1; display: flex; gap: 6px; flex-wrap: wrap; }
  .tagc { font: 600 12px var(--f-ui); padding: 3px 8px; border-radius: 999px; background: var(--p-track); color: var(--p-fg); }
  .pts { color: var(--p-good); font-weight: 700; }
  .pts.none { color: var(--p-muted); font-weight: 600; }
  .chev { transition: transform .2s ease; display: grid; }
  .chev.up { transform: rotate(180deg); }
  .blist { display: flex; flex-direction: column; background: var(--p-track); border-radius: 16px; padding: 4px 6px 4px 12px; }
  .br { display: flex; align-items: center; gap: 10px; padding: 7px 0; font: 600 14px var(--f-ui); min-height: 48px; }
  .br + .br { border-top: 1px solid var(--p-hair-strong); }
  .w { flex: 1; display: flex; flex-direction: column; line-height: 1.25; }
  .w small { font: 500 11.5px var(--f-ui); color: var(--p-muted); }
</style>
