<script lang="ts">
  import Avatar from '../components/Avatar.svelte';
  import type { Game, GameDefinition, Player, Round } from '../games/types';
  import { isLow, leaders, progressOf, totals } from '../lib/engine';

  let {
    def,
    game,
    rounds,
    players,
    current = -1,
    onpick,
  }: { def: GameDefinition; game: Game; rounds: Round[]; players: Player[]; current?: number; onpick: (index: number) => void } = $props();

  const t = $derived(totals(def, game, rounds));
  const lead = $derived(leaders(t, isLow(def, game.options)));
  const prog = $derived(progressOf(def, game.options));
  const rowCount = $derived(prog.kind === 'rounds' ? Math.max(prog.max, rounds.length) : rounds.length);
  const byIndex = $derived(new Map(rounds.map((r) => [r.index, r])));
</script>

<div class="card lift sheet">
  <div class="scroll">
    <table>
      <thead>
        <tr>
          <th class="rd">Rd</th>
          {#each players as p (p.id)}<th><Avatar player={p} size={30} /><span class="pn">{p.name}</span></th>{/each}
        </tr>
      </thead>
      <tbody>
        {#each { length: rowCount } as _, i}
          {@const r = byIndex.get(i)}
          <tr class:now={i === current} class:tap={!!r} onclick={() => r && onpick(i)}>
            <td class="rd">{i + 1}</td>
            {#each players as p (p.id)}
              {@const e = r?.entries[p.id]}
              {@const pts = e !== undefined ? def.score(e, i, game.options) : null}
              {#if pts === null}
                <td class="e">·</td>
              {:else}
                <td class:neg={pts < 0}>{pts < 0 ? `−${-pts}` : pts}<small>{def.cellDetail(e, i, game.options)}</small></td>
              {/if}
            {/each}
          </tr>
        {/each}
      </tbody>
      <tfoot>
        <tr>
          <td class="rd">Total</td>
          {#each players as p (p.id)}<td class:lead={lead.includes(p.id)}>{t[p.id]}</td>{/each}
        </tr>
      </tfoot>
    </table>
  </div>
</div>
<p class="hint">Tap a round to change it</p>

<style>
  .sheet { padding: 6px 0 4px; overflow: hidden; }
  .scroll { overflow-x: auto; }
  table { width: 100%; border-collapse: separate; border-spacing: 0; font-variant-numeric: tabular-nums; }
  th { padding: 8px 2px 10px; font-weight: 600; vertical-align: top; }
  th :global(.av) { margin: 0 auto; }
  .pn { display: block; font: 600 10.5px var(--f-ui); color: var(--p-muted); margin-top: 3px; max-width: 64px; margin-inline: auto; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .rd { width: 42px; text-align: center; font: 700 11.5px var(--f-ui); color: var(--p-muted); text-transform: uppercase; letter-spacing: .03em; }
  td { text-align: center; padding: 7px 2px; font: 700 15px var(--f-ui); min-width: 54px; }
  td small { display: block; font: 500 10.5px var(--f-ui); color: var(--p-muted); margin-top: 1px; white-space: nowrap; }
  td.neg { color: var(--p-bad); }
  td.e { color: var(--p-hair-strong); font-weight: 500; }
  tbody tr:nth-child(odd) td { background: var(--p-zebra); }
  tr.tap { cursor: pointer; }
  tr.now td { background: var(--p-accent-soft) !important; }
  tr.now td.rd { color: var(--p-accent-text); }
  tr.now td:first-child { border-radius: 12px 0 0 12px; }
  tr.now td:last-child { border-radius: 0 12px 12px 0; }
  tfoot td { font: 800 18px var(--f-ui); padding-top: 12px; border-top: 1px solid var(--p-hair); }
  tfoot td.rd { font-size: 11px; }
  tfoot td.lead { color: var(--p-gold-text); }
  .hint { text-align: center; font: 500 12.5px var(--f-ui); color: var(--p-muted); margin: 0; }
</style>
