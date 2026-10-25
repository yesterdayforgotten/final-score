<script lang="ts">
  import type { Snippet } from 'svelte';
  import { fade, fly } from 'svelte/transition';

  let { open, onclose, label, children }: { open: boolean; onclose: () => void; label: string; children: Snippet } = $props();

  function onkey(e: KeyboardEvent) {
    if (open && e.key === 'Escape') onclose();
  }
</script>

<svelte:window onkeydown={onkey} />

{#if open}
  <div class="scrim" transition:fade={{ duration: 180 }} onclick={onclose} aria-hidden="true"></div>
  <div class="bsheet" role="dialog" aria-modal="true" aria-label={label} transition:fly={{ y: 400, duration: 260, opacity: 1 }}>
    <div class="grab" aria-hidden="true"></div>
    {@render children()}
  </div>
{/if}

<style>
  .scrim { position: fixed; inset: 0; background: rgba(12, 10, 24, .45); z-index: 40; }
  .bsheet {
    position: fixed; z-index: 41; left: 6px; right: 6px; bottom: calc(6px + var(--safe-bottom));
    max-width: 520px; margin: 0 auto; max-height: calc(100dvh - var(--safe-top) - 40px); overflow-y: auto;
    background: var(--p-surface); color: var(--p-fg); border-radius: 32px;
    padding: 10px 16px 18px; display: flex; flex-direction: column; gap: 14px;
    box-shadow: 0 -20px 40px -20px rgba(0,0,0,.4);
  }
  .grab { width: 38px; height: 5px; border-radius: 3px; background: var(--p-hair-strong); margin: 0 auto 2px; flex: none; }
</style>
