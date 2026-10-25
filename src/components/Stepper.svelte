<script lang="ts">
  import Icon from './Icon.svelte';

  let {
    value,
    min = 0,
    max = 99,
    label,
    onchange,
  }: { value: number; min?: number; max?: number; label: string; onchange: (v: number) => void } = $props();
</script>

<span class="stp" role="group" aria-label={label}>
  <button aria-label="Fewer {label}" disabled={value <= min} onclick={() => onchange(value - 1)}><Icon name="minus" size={16} stroke={2.6} /></button>
  <em class="num" class:z={value === 0}>{value}</em>
  <button aria-label="More {label}" disabled={value >= max} onclick={() => onchange(value + 1)}><Icon name="plus" size={16} stroke={2.6} /></button>
</span>

<style>
  .stp { display: flex; align-items: center; gap: 2px; flex: none; }
  button { width: 32px; height: 32px; border-radius: 50%; display: grid; place-items: center; background: var(--p-surface); color: var(--p-accent-text); box-shadow: var(--p-shadow-sm); }
  button:disabled { opacity: .35; box-shadow: none; }
  em { font: 800 16px var(--f-ui); font-style: normal; width: 28px; text-align: center; }
  em.z { color: var(--p-muted); font-weight: 600; }
</style>
