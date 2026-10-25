<script lang="ts">
  import { haptics } from '../lib/haptics';

  /** Two on-screen dice. Tap to roll; they tumble briefly, then report the faces. */
  let {
    faces = $bindable<[number, number]>([1, 1]),
    disabled = false,
    onroll,
  }: { faces?: [number, number]; disabled?: boolean; onroll: (a: number, b: number) => void } = $props();

  let rolling = $state(false);

  const PIPS: Record<number, number[]> = {
    1: [4],
    2: [0, 8],
    3: [0, 4, 8],
    4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8],
    6: [0, 2, 3, 5, 6, 8],
  };

  function d6(): number {
    const buf = new Uint32Array(1);
    // Rejection sampling keeps every face equally likely.
    do crypto.getRandomValues(buf);
    while (buf[0] >= 4294967292);
    return (buf[0] % 6) + 1;
  }

  function roll() {
    if (rolling || disabled) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const result: [number, number] = [d6(), d6()];
    if (reduce) {
      faces = result;
      onroll(...result);
      return;
    }
    rolling = true;
    haptics.rattle();
    const flicker = setInterval(() => (faces = [d6(), d6()]), 70);
    setTimeout(() => {
      clearInterval(flicker);
      faces = result;
      rolling = false;
      onroll(...result);
    }, 650);
  }
</script>

<button class="dice" class:rolling {disabled} onclick={roll} aria-label={rolling ? 'Rolling' : `Roll the dice. Last roll ${faces[0]} and ${faces[1]}`}>
  {#each faces as f, i}
    <span class="die d{i}" aria-hidden="true">
      {#each { length: 9 } as _, cell}<i class:on={PIPS[f].includes(cell)}></i>{/each}
    </span>
  {/each}
</button>

<style>
  .dice { display: flex; gap: 22px; justify-content: center; align-items: center; padding: 10px; border-radius: 22px; width: 100%; }
  .dice:disabled { opacity: .45; }
  .die {
    width: 72px; height: 72px; border-radius: 16px; padding: 11px;
    display: grid; grid-template-columns: repeat(3, 1fr); grid-template-rows: repeat(3, 1fr); place-items: center;
    background: linear-gradient(150deg, #ffffff, #e9e4d6);
    box-shadow: inset 0 -4px 0 rgba(0,0,0,.08), 0 10px 18px -8px rgba(0,0,0,.45);
  }
  .die i { width: 12px; height: 12px; border-radius: 50%; background: transparent; }
  .die i.on { background: #1d2a24; box-shadow: inset 0 2px 2px rgba(0,0,0,.35); }
  .rolling .d0 { animation: tumble .65s cubic-bezier(.3,.7,.4,1); }
  .rolling .d1 { animation: tumble2 .65s cubic-bezier(.3,.7,.4,1); }
  @keyframes tumble {
    0% { transform: translate(0, 0) rotate(0); }
    30% { transform: translate(-14px, -26px) rotate(-160deg); }
    60% { transform: translate(6px, 4px) rotate(-290deg); }
    80% { transform: translate(-2px, -6px) rotate(-345deg); }
    100% { transform: translate(0, 0) rotate(-360deg); }
  }
  @keyframes tumble2 {
    0% { transform: translate(0, 0) rotate(0); }
    30% { transform: translate(14px, -30px) rotate(170deg); }
    60% { transform: translate(-6px, 4px) rotate(300deg); }
    80% { transform: translate(2px, -5px) rotate(350deg); }
    100% { transform: translate(0, 0) rotate(360deg); }
  }
</style>
