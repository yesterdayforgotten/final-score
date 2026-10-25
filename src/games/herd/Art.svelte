<script lang="ts">
  import Cow from './Cow.svelte';
</script>

<div class="herd" aria-hidden="true">
  <span class="c1"><Cow size={84} /></span>
  <span class="c2"><Cow size={62} pink /></span>
</div>

<style>
  .herd { position: relative; width: 150px; height: 120px; }
  span { position: absolute; display: block; filter: drop-shadow(0 8px 12px rgba(0,0,0,.25)); }
  .c1 { left: 6px; top: 14px; transform: rotate(-10deg); }
  .c2 { right: 4px; top: 40px; transform: rotate(12deg); }
</style>
