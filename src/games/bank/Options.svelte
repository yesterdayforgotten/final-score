<script lang="ts">
  import type { OptionsProps } from '../types';
  import { ROUND_CHOICES, type BankOptions } from './rules';

  let { options = $bindable() }: OptionsProps<BankOptions> = $props();
</script>

<div class="card">
  <div class="optrow">
    <span>Rounds<small>Highest total after the last round wins</small></span>
    <span class="mseg" role="radiogroup" aria-label="Rounds">
      {#each ROUND_CHOICES as n}
        <button role="radio" aria-checked={options.rounds === n} class:on={options.rounds === n} onclick={() => (options.rounds = n)}>{n}</button>
      {/each}
    </span>
  </div>
</div>

<style>
  .mseg { display: grid; grid-template-columns: repeat(4, 1fr); padding: 3px; gap: 3px; background: var(--p-track); border-radius: 12px; width: 176px; flex: none; }
  .mseg button { height: 34px; border-radius: 9px; font: 600 14px var(--f-ui); color: var(--p-muted); font-variant-numeric: tabular-nums; }
  .mseg button.on { background: var(--p-thumb); color: var(--p-on-thumb); font-weight: 800; box-shadow: 0 2px 6px rgba(0,0,0,.12); }
</style>
