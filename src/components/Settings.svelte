<script lang="ts">
  import { hapticsEnabled, setHapticsEnabled } from '../lib/haptics';
  import Appearance from './Appearance.svelte';
  import Toggle from './Toggle.svelte';

  let vibrate = $state(hapticsEnabled());
</script>

<div class="lbl">Appearance</div>
<Appearance />
<div class="row">
  <span>Vibration<small>Buzz on dice rolls, doubles, busts and banking</small></span>
  <Toggle on={vibrate} label="Vibration" onchange={(v) => { vibrate = v; setHapticsEnabled(v); }} />
</div>

<style>
  .lbl { font: 700 12px var(--f-ui); color: var(--p-muted); letter-spacing: .04em; text-transform: uppercase; margin: 2px 4px -6px; }
  .row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 6px 4px 4px; font: 700 15px var(--f-ui); }
  .row small { display: block; font: 500 12.5px var(--f-ui); color: var(--p-muted); }
</style>
