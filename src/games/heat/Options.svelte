<script lang="ts">
  import Icon from '../../components/Icon.svelte';
  import type { OptionsProps } from '../types';
  import type { HeatOptions } from './rules';

  let { options = $bindable() }: OptionsProps<HeatOptions> = $props();
</script>

<div class="card">
  <div class="optrow">
    <span>Game ends at<small>After the round anyone reaches it · lowest total wins</small></span>
    <span class="stp" role="group" aria-label="Ending score">
      <button aria-label="Lower ending score" disabled={options.target <= 11} onclick={() => (options.target -= 11)}><Icon name="minus" size={16} stroke={2.6} /></button>
      <em class="num">{options.target}</em>
      <button aria-label="Raise ending score" onclick={() => (options.target += 11)}><Icon name="plus" size={16} stroke={2.6} /></button>
    </span>
  </div>
</div>

<style>
  .stp { display: flex; align-items: center; gap: 2px; flex: none; }
  button { width: 32px; height: 32px; border-radius: 50%; display: grid; place-items: center; background: var(--p-track); color: var(--p-accent-text); }
  button:disabled { opacity: .35; }
  em { font: 800 16px var(--f-ui); font-style: normal; width: 40px; text-align: center; }
</style>
