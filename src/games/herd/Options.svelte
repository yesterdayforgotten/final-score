<script lang="ts">
  import Stepper from '../../components/Stepper.svelte';
  import Toggle from '../../components/Toggle.svelte';
  import type { OptionsProps } from '../types';
  import type { HerdOptions } from './rules';

  let { options = $bindable(), inGame }: OptionsProps<HerdOptions> = $props();
</script>

<div class="card">
  <div class="optrow">
    <span>Cows to win<small>First to {options.target}, unless they hold the pink cow</small></span>
    <Stepper value={options.target} min={3} max={20} label="cows to win" onchange={(v) => (options.target = v)} />
  </div>
  <div class="optrow">
    <span>Questions from the app<small>{options.questions ? 'A new question each round' : 'Using the question cards'}</small></span>
    <Toggle on={options.questions} label="Questions from the app" onchange={(v) => (options.questions = v)} />
  </div>
</div>
{#if inGame}<p class="note">Changes apply from this round.</p>{/if}

<style>
  .note { margin: 0 6px; font: 500 12.5px var(--f-ui); color: var(--p-muted); }
</style>
