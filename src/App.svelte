<script lang="ts">
  import { gameById } from './games/registry';
  import { route } from './lib/router.svelte';
  import { applyUpdate, update } from './lib/update.svelte';
  import GameHome from './routes/GameHome.svelte';
  import Home from './routes/Home.svelte';
  import NewGame from './routes/NewGame.svelte';
  import Play from './routes/Play.svelte';
  import Players from './routes/Players.svelte';

  const [a, b, c] = $derived(route.path);
  const def = $derived(a === 'g' && b ? gameById(b) : undefined);
  const inGame = $derived(a === 'play');

  // A held-back update applies as soon as nobody is mid-game.
  $effect(() => {
    if (update.ready && !inGame) applyUpdate();
  });
</script>

{#if a === 'players'}
  <Players />
{:else if a === 'play' && b}
  {#key b}<Play id={b} />{/key}
{:else if def && c === 'new'}
  {#key route.query.get('from')}<NewGame {def} from={route.query.get('from')} />{/key}
{:else if def}
  {#key def.id}<GameHome {def} />{/key}
{:else}
  <Home />
{/if}

{#if update.ready}
  <div class="toast" role="status">A new version is ready<button onclick={applyUpdate}>Reload</button></div>
{/if}
