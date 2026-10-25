<script lang="ts">
  import type { Player } from '../games/types';
  import { initial, isEmoji } from '../lib/format';

  let { player, size = 36, ring = false }: { player: Pick<Player, 'name' | 'color'>; size?: number; ring?: boolean } = $props();
  const ch = $derived(initial(player.name));
  const emoji = $derived(isEmoji(ch));
</script>

<span
  class="av c{player.color % 8}"
  class:ring
  style:width="{size}px"
  style:height="{size}px"
  class:emoji
  style:font-size="{Math.round(size * (emoji ? 0.55 : 0.39))}px"
  aria-hidden="true">{ch}</span>

<style>
  .av {
    border-radius: 50%; display: grid; place-items: center; flex: none;
    font-family: var(--f-ui); font-weight: 700; color: #fff; letter-spacing: -.02em; line-height: 1;
  }
  .ring { box-shadow: 0 0 0 2.5px var(--p-surface); }
  .emoji { font-family: 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif; letter-spacing: 0; }
  .c0 { background: linear-gradient(140deg, #f08a6e, #de5a4c); }
  .c1 { background: linear-gradient(140deg, #6aa5ff, #3d6fe0); }
  .c2 { background: linear-gradient(140deg, #4fd09a, #23a06d); }
  .c3 { background: linear-gradient(140deg, #c08bff, #8c55e0); }
  .c4 { background: linear-gradient(140deg, #ffc65c, #ee9b12); }
  .c5 { background: linear-gradient(140deg, #5fd3e0, #2aa6b8); }
  .c6 { background: linear-gradient(140deg, #ff8fbf, #e0508f); }
  .c7 { background: linear-gradient(140deg, #9aa7b8, #66758a); }
</style>
