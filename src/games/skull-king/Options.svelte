<script lang="ts">
  import Stepper from '../../components/Stepper.svelte';
  import type { OptionsProps } from '../types';
  import { firstCards, lastCards, MAX_CARDS, roundCount, type SkOptions } from './rules';

  let { options = $bindable() }: OptionsProps<SkOptions> = $props();

  // Older games only had a round count; normalise to start/end.
  $effect.pre(() => {
    if (options.startCards == null || options.endCards == null) {
      options.startCards = firstCards(options);
      options.endCards = lastCards(options);
      delete options.rounds;
    }
  });

  const rounds = $derived(roundCount(options));
</script>

<div class="card">
  <div class="optrow">
    <span>Scoring<small>{options.scoring === 'classic' ? '20 per trick bid, −10 per trick off' : 'Points per card dealt; Cannonball option'}</small></span>
    <span class="mseg" role="radiogroup" aria-label="Scoring">
      <button role="radio" aria-checked={options.scoring === 'classic'} class:on={options.scoring === 'classic'} onclick={() => (options.scoring = 'classic')}>Classic</button>
      <button role="radio" aria-checked={options.scoring === 'rascal'} class:on={options.scoring === 'rascal'} onclick={() => (options.scoring = 'rascal')}>Rascal</button>
    </span>
  </div>
  <div class="optrow">
    <span>First round<small>{options.startCards === 1 ? '1 card each' : `${options.startCards} cards each`}</small></span>
    <Stepper value={options.startCards} min={1} max={options.endCards} label="cards in the first round" onchange={(v) => (options.startCards = v)} />
  </div>
  <div class="optrow">
    <span>Last round<small>{options.endCards} cards each · {rounds} {rounds === 1 ? 'round' : 'rounds'} in all</small></span>
    <Stepper value={options.endCards} min={options.startCards} max={MAX_CARDS} label="cards in the last round" onchange={(v) => (options.endCards = v)} />
  </div>
</div>

<style>
  .mseg { display: grid; grid-template-columns: 1fr 1fr; padding: 3px; gap: 3px; background: var(--p-track); border-radius: 12px; width: 170px; flex: none; }
  .mseg button { height: 34px; border-radius: 9px; font: 600 13.5px var(--f-ui); color: var(--p-muted); }
  .mseg button.on { background: var(--p-thumb); color: var(--p-on-thumb); font-weight: 800; box-shadow: 0 2px 6px rgba(0,0,0,.12); }
</style>
