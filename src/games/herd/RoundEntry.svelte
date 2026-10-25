<script lang="ts">
  import Avatar from '../../components/Avatar.svelte';
  import Icon from '../../components/Icon.svelte';
  import { haptics } from '../../lib/haptics';
  import type { RoundEntryProps } from '../types';
  import Cow from './Cow.svelte';
  import { nextQuestion } from './questions';
  import { isOver, pinkHolder, type HerdEntry, type HerdOptions } from './rules';

  let { game, round = $bindable(), players, before, rounds, editing, onchange, onnext }: RoundEntryProps<HerdOptions, HerdEntry> = $props();

  // A fresh question for a new round, if the app is asking them.
  $effect.pre(() => {
    if (!round.data) round.data = { question: null, done: false };
    if (game.options.questions && !round.data.question && !round.data.done) {
      round.data.question = nextQuestion();
      onchange();
    }
  });

  const pinkBefore = $derived(pinkHolder(rounds, round.index - 1));
  const oddNow = $derived(players.find((p) => round.entries[p.id].odd)?.id ?? null);
  const pinkAfter = $derived(oddNow ?? pinkBefore);
  const herd = $derived(players.filter((p) => round.entries[p.id].herd));
  const after = $derived(Object.fromEntries(players.map((p) => [p.id, (before[p.id] ?? 0) + (round.entries[p.id].herd ? 1 : 0)])));
  const ending = $derived(!editing && isOver(game, after, rounds.map((r) => (r.index === round.index ? round : r))));
  const pinkName = (id: string | null) => players.find((p) => p.id === id)?.name;

  function toggleHerd(pid: string) {
    const e = round.entries[pid];
    e.herd = !e.herd;
    if (e.herd) e.odd = false;
    haptics.tap();
    onchange();
  }

  function toggleOdd(pid: string) {
    const e = round.entries[pid];
    const on = !e.odd;
    for (const p of players) round.entries[p.id].odd = false;
    e.odd = on;
    if (on) e.herd = false;
    haptics.tap();
    onchange();
  }

  function skip() {
    round.data.question = nextQuestion(round.data.question);
    onchange();
  }

  function finish() {
    round.data.done = true;
    onchange();
    onnext();
  }
</script>

{#if game.options.questions}
  <div class="card lift qcard">
    <span class="ql">Round {round.index + 1} · question</span>
    <p class="q">{round.data?.question ?? ''}</p>
    {#if !round.data?.done}
      <button class="skip" onclick={skip}><Icon name="repeat" size={15} stroke={2.4} />Different question</button>
    {/if}
  </div>
{/if}

{#if pinkBefore}
  <div class="pinkbar" class:lift={!game.options.questions}>
    <Cow pink size={30} />
    <span><b>{pinkName(pinkBefore)} has the pink cow</b>They can't win while holding it</span>
  </div>
{/if}

<div class="sec"><span>Who was in the herd?</span><span>{herd.length} {herd.length === 1 ? 'cow' : 'cows'} this round</span></div>

{#each players as p (p.id)}
  {@const e = round.entries[p.id]}
  <div class="card pc">
    <div class="pc-h">
      <Avatar player={p} />
      <div class="who">
        <span class="nm"><span class="t">{p.name}</span>{#if pinkAfter === p.id}<span class="pk"><Cow pink size={16} />Pink cow</span>{/if}</span>
        <span class="sub num">{after[p.id]} of {game.options.target} cows</span>
      </div>
    </div>
    <div class="acts">
      <button class="act herd" class:on={e.herd} aria-pressed={e.herd} onclick={() => toggleHerd(p.id)}><Cow size={20} />In the herd</button>
      <button class="act odd" class:on={e.odd} aria-pressed={e.odd} onclick={() => toggleOdd(p.id)}><Cow pink size={20} />Odd one out</button>
    </div>
  </div>
{/each}

<p class="help">Tap everyone who gave the most popular answer. If there was a tie for most popular, nobody gets a cow. If exactly one person was alone with their answer, they're the odd one out and take the pink cow.</p>

<div class="dock">
  <button class="cta" onclick={finish}>
    {#if editing}Done{:else if ending}Finish game{:else}Next round<Icon name="next" size={18} stroke={2.4} />{/if}
  </button>
</div>

<style>
  .qcard { margin-top: 4px; padding: 18px 18px 14px; display: flex; flex-direction: column; align-items: center; gap: 6px; text-align: center; }
  .ql { font: 700 11.5px var(--f-ui); letter-spacing: .12em; text-transform: uppercase; color: var(--p-muted); }
  .q { margin: 0; font: 400 26px var(--f-herd); line-height: 1.2; color: var(--p-accent-text); text-wrap: balance; letter-spacing: .01em; }
  .skip { display: flex; align-items: center; gap: 6px; font: 700 13px var(--f-ui); color: var(--p-muted); padding: 8px 10px 2px; }
  .pinkbar { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-radius: 18px; background: #ffe1ef; color: #8a1f55; }
  .pinkbar.lift { margin-top: 4px; }
  .pinkbar span { font: 500 12.5px var(--f-ui); display: flex; flex-direction: column; }
  .pinkbar b { font: 800 14.5px var(--f-ui); }
  :global([data-theme='dark']) .pinkbar { background: rgba(255,120,180,.16); color: #ffb3d4; }
  .pk { display: inline-flex; align-items: center; gap: 4px; flex: none; font: 800 10.5px var(--f-ui); letter-spacing: .04em; text-transform: uppercase; padding: 2px 8px 2px 4px; border-radius: 999px; background: #ffe1ef; color: #b02a6c; }
  :global([data-theme='dark']) .pk { background: rgba(255,120,180,.16); color: #ffb3d4; }
  .acts { display: grid; grid-template-columns: 1.4fr 1fr; gap: 8px; }
  .act { height: 46px; border-radius: 13px; display: flex; align-items: center; justify-content: center; gap: 8px; font: 700 14.5px var(--f-ui); background: var(--p-track); color: var(--p-muted); transition: background .15s, color .15s; }
  .act.herd.on { background: var(--p-good); color: #fff; }
  .act.odd.on { background: #ff5fa2; color: #fff; }
  .help { margin: 4px 6px 0; font: 500 12.5px var(--f-ui); color: var(--p-muted); line-height: 1.5; }
</style>
