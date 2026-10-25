<script lang="ts">
  let { on, label, onchange }: { on: boolean; label: string; onchange: (v: boolean) => void } = $props();
</script>

<button class="tg" class:on role="switch" aria-checked={on} aria-label={label} onclick={() => onchange(!on)}></button>

<style>
  .tg { width: 48px; height: 30px; border-radius: 999px; background: var(--p-hair-strong); position: relative; flex: none; transition: background .2s ease; }
  .tg::after { content: ''; position: absolute; top: 3px; left: 3px; width: 24px; height: 24px; border-radius: 50%; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,.25); transition: transform .2s ease; }
  .tg.on { background: var(--p-good); }
  .tg.on::after { transform: translateX(18px); }
</style>
