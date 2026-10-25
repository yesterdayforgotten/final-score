<script lang="ts">
  import { appearance, setMode, type Mode } from '../lib/appearance.svelte';
  import Icon from './Icon.svelte';

  const modes: { id: Mode; label: string; icon: string }[] = [
    { id: 'light', label: 'Light', icon: 'sun' },
    { id: 'dark', label: 'Dark', icon: 'moon' },
    { id: 'system', label: 'Auto', icon: 'auto' },
  ];
</script>

<div class="ap" role="radiogroup" aria-label="Appearance">
  {#each modes as m}
    <button role="radio" aria-checked={appearance.mode === m.id} class:on={appearance.mode === m.id} onclick={() => setMode(m.id)}>
      <Icon name={m.icon} size={17} />{m.label}
    </button>
  {/each}
</div>

<style>
  .ap { display: grid; grid-template-columns: repeat(3, 1fr); gap: 3px; padding: 3px; border-radius: 14px; background: var(--p-track); }
  button { height: 40px; border-radius: 11px; display: flex; align-items: center; justify-content: center; gap: 6px; font: 600 14px var(--f-ui); color: var(--p-muted); }
  button.on { background: var(--p-thumb); color: var(--p-on-thumb); font-weight: 800; box-shadow: 0 2px 6px rgba(0,0,0,.12); }
</style>
