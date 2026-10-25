<script lang="ts">
  import Stepper from '../../components/Stepper.svelte';
  import type { OptionsProps } from '../types';
  import { ROUND_CHOICES, type BankOptions } from './rules';

  let { options = $bindable(), inGame }: OptionsProps<BankOptions> = $props();

  const min = $derived(inGame?.currentRound ?? 1);
</script>

<div class="card">
  <div class="optrow">
    <span>Rounds<small>{inGame ? `Playing round ${inGame.currentRound} of ${options.rounds}` : 'Highest total after the last round wins'}</small></span>
    <Stepper value={options.rounds} {min} max={50} label="rounds" onchange={(v) => (options.rounds = v)} />
  </div>
  <div class="quick" role="group" aria-label="Common lengths">
    {#each ROUND_CHOICES as n}
      <button class:on={options.rounds === n} disabled={n < min} onclick={() => (options.rounds = n)}>{n}</button>
    {/each}
  </div>
</div>

<style>
  .quick { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; padding: 0 14px 14px; }
  .quick button { height: 36px; border-radius: 10px; background: var(--p-track); font: 700 14px var(--f-ui); color: var(--p-muted); font-variant-numeric: tabular-nums; }
  .quick button.on { background: var(--p-thumb); color: var(--p-on-thumb); }
  .quick button:disabled { opacity: .35; }
</style>
