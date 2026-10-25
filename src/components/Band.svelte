<script lang="ts">
  import type { Snippet } from 'svelte';
  import Icon from './Icon.svelte';

  let {
    mid = '',
    onback,
    backIcon = 'back',
    backLabel = 'Back',
    right,
    art,
    title,
    children,
    plain = false,
  }: {
    mid?: string;
    onback?: () => void;
    backIcon?: string;
    backLabel?: string;
    right?: Snippet;
    art?: Snippet;
    title?: Snippet;
    children?: Snippet;
    plain?: boolean;
  } = $props();
</script>

<header class="band" class:plain>
  {#if art}<div class="wm" aria-hidden="true">{@render art()}</div>{/if}
  {#if onback || right || mid}
    <div class="nav">
      {#if onback}
        <button class="ibtn" onclick={onback} aria-label={backLabel}><Icon name={backIcon} /></button>
      {:else}
        <span class="spacer"></span>
      {/if}
      <span class="mid">{mid}</span>
      {#if right}{@render right()}{:else}<span class="spacer"></span>{/if}
    </div>
  {/if}
  {#if title}<div class="htitle">{@render title()}</div>{/if}
  {@render children?.()}
</header>

<style>
  .band {
    flex: none; position: relative; overflow: hidden;
    color: var(--p-hdr-fg);
    background: linear-gradient(165deg, var(--p-hdr-1), var(--p-hdr-2));
    padding: calc(var(--safe-top) + 8px) 0 30px;
  }
  .band.plain { background: transparent; color: var(--p-fg); padding-bottom: 8px; }
  .wm { position: absolute; right: -40px; top: calc(var(--safe-top) + 30px); width: 220px; height: 220px; color: var(--p-hdr-fg); opacity: .06; pointer-events: none; }
  .wm :global(svg) { width: 100%; height: 100%; }
  .nav { display: flex; align-items: center; gap: 10px; padding: 0 var(--gutter-r) 0 var(--gutter-l); position: relative; min-height: 44px; }
  .mid { flex: 1; min-width: 0; text-align: center; font: 600 14px var(--f-ui); color: var(--p-hdr-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .spacer { width: 40px; flex: none; }
  .band :global(.ibtn) {
    width: 40px; height: 40px; border-radius: 50%; display: grid; place-items: center; flex: none;
    background: var(--p-hdr-chip); color: inherit;
  }
  .band.plain :global(.ibtn) { background: var(--p-surface); box-shadow: var(--p-shadow-sm); }
  .htitle { padding: 8px calc(var(--gutter-r) + 6px) 0 calc(var(--gutter-l) + 6px); display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; position: relative; }
  .htitle :global(h1) { margin: 0; line-height: .95; font-weight: 400; }
</style>
