<script lang="ts">
  import Icon from '../../components/Icon.svelte';
  import type { OptionsProps } from '../types';
  import type { F7Options } from './rules';

  let { options = $bindable() }: OptionsProps<F7Options> = $props();
  const step = 50;
</script>

<div class="card">
  <div class="optrow">
    <span>Play to<small>Game ends after the round someone reaches it</small></span>
    <span class="stp" role="group" aria-label="Target score">
      <button aria-label="Lower target" disabled={options.target <= step} onclick={() => (options.target -= step)}><Icon name="minus" size={16} stroke={2.6} /></button>
      <em class="num">{options.target}</em>
      <button aria-label="Raise target" disabled={options.target >= 1000} onclick={() => (options.target += step)}><Icon name="plus" size={16} stroke={2.6} /></button>
    </span>
  </div>
</div>

<style>
  .stp { display: flex; align-items: center; gap: 2px; flex: none; }
  button { width: 32px; height: 32px; border-radius: 50%; display: grid; place-items: center; background: var(--p-track); color: var(--p-accent-text); }
  button:disabled { opacity: .35; }
  em { font: 800 16px var(--f-ui); font-style: normal; width: 46px; text-align: center; }
</style>
