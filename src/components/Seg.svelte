<script lang="ts">
  /** Segmented picker for 0..max. `mark` puts a dot under one value (e.g. the bid). */
  let {
    max,
    value,
    mark = null,
    label,
    onselect,
  }: { max: number; value: number | null; mark?: number | null; label: string; onselect: (v: number) => void } = $props();

  const count = $derived(max + 1);
  const cols = $derived(count > 8 ? Math.ceil(count / 2) : count);
</script>

<div class="seg" role="radiogroup" aria-label={label} style:--cols={cols}>
  {#each { length: count } as _, v}
    <button
      role="radio"
      aria-checked={value === v}
      class:on={value === v}
      class:mark={mark === v}
      onclick={() => onselect(v)}>{v}</button>
  {/each}
</div>

<style>
  .seg { display: grid; grid-template-columns: repeat(var(--cols), 1fr); gap: 3px; padding: 3px; border-radius: 14px; background: var(--p-track); }
  button {
    height: 42px; border-radius: 11px; display: grid; place-items: center; position: relative;
    font: 600 16px var(--f-ui); font-variant-numeric: tabular-nums; color: var(--p-muted);
    transition: background .15s ease, color .15s ease, box-shadow .15s ease;
  }
  button.on { background: var(--p-thumb); color: var(--p-on-thumb); box-shadow: 0 2px 6px rgba(0,0,0,.14), 0 0 0 .5px rgba(0,0,0,.04); font-weight: 800; }
  button.mark::after { content: ''; position: absolute; bottom: 5px; width: 4px; height: 4px; border-radius: 50%; background: var(--p-gold); }
</style>
