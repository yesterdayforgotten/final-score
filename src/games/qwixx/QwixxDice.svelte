<script lang="ts">
  import { haptics } from '../../lib/haptics';
  import type { Color } from './rules';

  /** Six dice: two white plus one per colour; dice for locked rows are left out. */
  let { locked }: { locked: Color[] } = $props();

  type Die = { id: string; color: 'white' | Color };
  const ALL: Die[] = [
    { id: 'w1', color: 'white' }, { id: 'w2', color: 'white' },
    { id: 'red', color: 'red' }, { id: 'yellow', color: 'yellow' }, { id: 'green', color: 'green' }, { id: 'blue', color: 'blue' },
  ];
  const dice = $derived(ALL.filter((d) => d.color === 'white' || !locked.includes(d.color)));

  let faces = $state<Record<string, number>>({ w1: 3, w2: 4, red: 1, yellow: 2, green: 5, blue: 6 });
  let rolled = $state(false);
  let rolling = $state(false);

  const PIPS: Record<number, number[]> = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };

  function d6(): number {
    const buf = new Uint32Array(1);
    do crypto.getRandomValues(buf);
    while (buf[0] >= 4294967292);
    return (buf[0] % 6) + 1;
  }

  function roll() {
    if (rolling) return;
    const result = Object.fromEntries(ALL.map((d) => [d.id, d6()]));
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      faces = result;
      rolled = true;
      return;
    }
    rolling = true;
    haptics.rattle();
    const flicker = setInterval(() => (faces = Object.fromEntries(ALL.map((d) => [d.id, d6()]))), 70);
    setTimeout(() => {
      clearInterval(flicker);
      faces = result;
      rolling = false;
      rolled = true;
      haptics.land();
    }, 650);
  }
</script>

<button class="tray" class:rolling onclick={roll} aria-label="Roll the dice">
  <span class="row">
    {#each dice as d (d.id)}
      <span class="die {d.color}" aria-hidden="true">{#each { length: 9 } as _, cell}<i class:on={PIPS[faces[d.id]].includes(cell)}></i>{/each}</span>
    {/each}
  </span>
  <span class="cap">{rolled && !rolling ? `White dice: ${faces.w1 + faces.w2} · tap to roll again` : 'Tap to roll'}</span>
</button>

<style>
  .tray { width: 100%; display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 12px 8px 10px; }
  .row { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; }
  .die { width: 40px; height: 40px; border-radius: 9px; padding: 6px; display: grid; grid-template-columns: repeat(3, 1fr); place-items: center; box-shadow: inset 0 -3px 0 rgba(0,0,0,.15), 0 6px 10px -6px rgba(0,0,0,.4); }
  .die i { width: 7px; height: 7px; border-radius: 50%; }
  .die.white { background: #fff; box-shadow: inset 0 0 0 1.5px #d6d9e0, inset 0 -3px 0 rgba(0,0,0,.08); }
  .die.white i.on { background: #1d1f27; }
  .die.red { background: #e2433a; } .die.yellow { background: #f5c518; } .die.green { background: #2fa25a; } .die.blue { background: #2f6fd6; }
  .die:not(.white) i.on { background: #fff; }
  .die.yellow i.on { background: #4a3a00; }
  .cap { font: 600 12.5px var(--f-ui); color: var(--p-muted); }
  .rolling .die:nth-child(odd) { animation: t1 .65s cubic-bezier(.3,.7,.4,1); }
  .rolling .die:nth-child(even) { animation: t2 .65s cubic-bezier(.3,.7,.4,1); }
  @keyframes t1 { 30% { transform: translateY(-14px) rotate(-150deg); } 70% { transform: translateY(2px) rotate(-330deg); } 100% { transform: rotate(-360deg); } }
  @keyframes t2 { 30% { transform: translateY(-18px) rotate(160deg); } 70% { transform: translateY(2px) rotate(340deg); } 100% { transform: rotate(360deg); } }
</style>
