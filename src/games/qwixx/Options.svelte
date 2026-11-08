<script lang="ts">
  import type { OptionsProps } from '../types';
  import type { QwixxOptions } from './rules';

  // Qwixx has no settings; the props are part of the shared Options contract.
  let {}: OptionsProps<QwixxOptions> = $props();
</script>

<div class="card info">
  <p>Each player gets a scoresheet to tap during play, or you can enter each row's crosses at the end. The game ends when two rows are locked or someone takes four penalties.</p>
</div>

<style>
  .info p { margin: 0; padding: 14px; font: 500 13.5px var(--f-ui); color: var(--p-muted); line-height: 1.5; }
</style>
