<script lang="ts">
  import type { OptionsProps } from '../types';
  import type { AzulOptions } from './rules';

  // Azul has no settings; the props are part of the shared Options contract.
  let {}: OptionsProps<AzulOptions> = $props();
</script>

<div class="card info">
  <p>The game ends after the round in which someone completes a horizontal row. Tap each player's new tiles every round, or switch any player to typing a number.</p>
</div>

<style>
  .info p { margin: 0; padding: 14px; font: 500 13.5px var(--f-ui); color: var(--p-muted); line-height: 1.5; }
</style>
