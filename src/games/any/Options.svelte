<script lang="ts">
  import Stepper from '../../components/Stepper.svelte';
  import type { OptionsProps } from '../types';
  import type { AnyOptions, EndMode } from './rules';

  let { options = $bindable(), inGame }: OptionsProps<AnyOptions> = $props();

  const ends: { id: EndMode; label: string }[] = [
    { id: 'open', label: 'When we stop' },
    { id: 'rounds', label: 'After rounds' },
    { id: 'target', label: 'At a score' },
  ];
</script>

<div class="card">
  <div class="optrow col">
    <span>Winner</span>
    <span class="seg2" role="radiogroup" aria-label="Winner">
      <button role="radio" aria-checked={!options.lowWins} class:on={!options.lowWins} onclick={() => (options.lowWins = false)}>Highest score</button>
      <button role="radio" aria-checked={options.lowWins} class:on={options.lowWins} onclick={() => (options.lowWins = true)}>Lowest score</button>
    </span>
  </div>
  <div class="optrow col">
    <span>Game ends</span>
    <span class="seg3" role="radiogroup" aria-label="Game ends">
      {#each ends as e}
        <button role="radio" aria-checked={options.end === e.id} class:on={options.end === e.id} onclick={() => (options.end = e.id)}>{e.label}</button>
      {/each}
    </span>
  </div>
  {#if options.end === 'rounds'}
    <div class="optrow">
      <span>Rounds{#if inGame}<small>Playing round {inGame.currentRound}</small>{/if}</span>
      <Stepper value={options.rounds} min={inGame?.currentRound ?? 1} max={99} label="rounds" onchange={(v) => (options.rounds = v)} />
    </div>
  {:else if options.end === 'target'}
    <div class="optrow">
      <span>Target score<small>Ends after the round anyone reaches it</small></span>
      <span class="tgt">
        <button aria-label="Lower target" disabled={options.target <= 10} onclick={() => (options.target = Math.max(10, options.target - (options.target > 100 ? 50 : 10)))}>−</button>
        <input type="text" inputmode="numeric" value={options.target} aria-label="Target score"
          oninput={(e) => { const v = Number(e.currentTarget.value.replace(/\D/g, '')); if (v) options.target = Math.min(100000, v); }} />
        <button aria-label="Raise target" onclick={() => (options.target += options.target >= 100 ? 50 : 10)}>+</button>
      </span>
    </div>
  {:else}
    <p class="hint">End it from the ⋯ menu when you're done.</p>
  {/if}
</div>

<style>
  .col { flex-direction: column; align-items: stretch; gap: 8px; }
  .seg2, .seg3 { display: grid; padding: 3px; gap: 3px; background: var(--p-track); border-radius: 12px; }
  .seg2 { grid-template-columns: 1fr 1fr; }
  .seg3 { grid-template-columns: repeat(3, 1fr); }
  .seg2 button, .seg3 button { height: 36px; border-radius: 9px; font: 600 13.5px var(--f-ui); color: var(--p-muted); }
  .seg2 button.on, .seg3 button.on { background: var(--p-thumb); color: var(--p-on-thumb); font-weight: 800; box-shadow: 0 2px 6px rgba(0,0,0,.12); }
  .tgt { display: flex; align-items: center; gap: 4px; flex: none; }
  .tgt button { width: 32px; height: 32px; border-radius: 50%; background: var(--p-track); color: var(--p-accent-text); font: 700 18px var(--f-ui); }
  .tgt button:disabled { opacity: .35; }
  .tgt input { width: 70px; height: 36px; border: 0; border-radius: 10px; background: var(--p-track); text-align: center; font: 800 16px var(--f-ui); color: var(--p-fg); font-variant-numeric: tabular-nums; outline: none; }
  .hint { margin: 0; padding: 0 14px 14px; font: 500 12.5px var(--f-ui); color: var(--p-muted); }
</style>
