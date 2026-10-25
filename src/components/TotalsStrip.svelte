<script lang="ts">
  import type { Player } from '../games/types';
  import Avatar from './Avatar.svelte';

  let {
    players,
    totals,
    leaders,
    target,
  }: { players: Player[]; totals: Record<string, number>; leaders: string[]; target?: number } = $props();
</script>

<div class="totals" style:--n={players.length}>
  {#each players as p (p.id)}
    {@const lead = leaders.includes(p.id)}
    <div class="tp" class:lead>
      {#if lead}
        <svg class="crown" viewBox="0 0 20 14" aria-label="Leading"><path fill="currentColor" d="M1 3.5l4.5 4L10 0l4.5 7.5L19 3.5 17.2 14H2.8z" /></svg>
      {/if}
      <Avatar player={p} size={30} />
      <span class="s num">{totals[p.id] ?? 0}</span>
      {#if target}
        <span class="bar"><i style:width="{Math.max(0, Math.min(100, ((totals[p.id] ?? 0) / target) * 100))}%"></i></span>
      {:else}
        <span class="n">{p.name}</span>
      {/if}
    </div>
  {/each}
</div>

<style>
  .totals {
    display: grid; grid-auto-flow: column; grid-auto-columns: minmax(74px, 1fr); gap: 8px;
    padding: 16px var(--gutter-r) 2px var(--gutter-l); position: relative;
    overflow-x: auto; scrollbar-width: none;
  }
  .totals::-webkit-scrollbar { display: none; }
  .tp { border-radius: 18px; padding: 10px 6px 9px; display: flex; flex-direction: column; align-items: center; gap: 4px; background: var(--p-hdr-chip); position: relative; margin-top: 8px; min-width: 0; }
  .tp :global(.av) { box-shadow: 0 0 0 2px var(--p-hdr-2); }
  .s { font: 800 19px var(--f-ui); letter-spacing: -.01em; line-height: 1; transition: color .2s; }
  .n { font: 600 11.5px var(--f-ui); color: var(--p-hdr-muted); line-height: 1.1; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .tp.lead { background: var(--p-hdr-lead); box-shadow: inset 0 0 0 1.5px var(--p-lead-ring, var(--p-gold)); }
  .crown { position: absolute; top: -9px; width: 20px; height: 14px; color: var(--p-lead-ring, var(--p-gold)); }
  .bar { width: 70%; height: 4px; border-radius: 2px; background: var(--p-hdr-chip-strong); overflow: hidden; margin-top: 2px; }
  .bar i { display: block; height: 100%; background: var(--p-lead-ring, var(--p-gold)); border-radius: 2px; transition: width .3s ease; }
</style>
