<script lang="ts">
  let { done, total, color = 'var(--p-accent)' }: { done: number; total: number; color?: string } = $props();
  const C = 2 * Math.PI * 19;
  const frac = $derived(total ? Math.min(1, done / total) : 0);
</script>

<svg class="ring" viewBox="0 0 46 46" aria-label="Round {done} of {total}">
  <circle cx="23" cy="23" r="19" fill="none" stroke="var(--p-track)" stroke-width="5" />
  <circle cx="23" cy="23" r="19" fill="none" stroke={color} stroke-width="5" stroke-linecap="round"
    stroke-dasharray="{C * frac} {C}" transform="rotate(-90 23 23)" />
  <text x="23" y="27.5" text-anchor="middle">{done}/{total}</text>
</svg>

<style>
  .ring { width: 46px; height: 46px; flex: none; }
  text { font: 800 12.5px var(--f-ui); fill: var(--p-fg); }
</style>
