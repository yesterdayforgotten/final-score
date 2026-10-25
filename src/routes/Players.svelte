<script lang="ts">
  import Avatar from '../components/Avatar.svelte';
  import Band from '../components/Band.svelte';
  import Icon from '../components/Icon.svelte';
  import Sheet from '../components/Sheet.svelte';
  import type { Player } from '../games/types';
  import { forgetPlayer, listPlayers, renamePlayer, type PlayerSummary } from '../lib/db';
  import { fmtShort, plural } from '../lib/format';
  import { back } from '../lib/router.svelte';
  import { BASE_COLOR, setThemeColor } from '../lib/theme';

  setThemeColor(BASE_COLOR);

  let rows = $state<PlayerSummary[]>([]);
  let loaded = $state(false);
  let forgetting = $state<Player | null>(null);
  let renaming = $state<Player | null>(null);
  let newName = $state('');
  let error = $state('');

  async function load() {
    rows = await listPlayers();
    loaded = true;
  }
  void load();

  function startRename(p: Player) {
    renaming = p;
    newName = p.name;
    error = '';
  }

  async function saveRename(e?: Event) {
    e?.preventDefault();
    if (!renaming) return;
    const res = await renamePlayer(renaming.id, newName);
    if (!res.ok) {
      error = res.reason;
      return;
    }
    renaming = null;
    await load();
  }

  async function confirmForget() {
    if (!forgetting) return;
    await forgetPlayer(forgetting.id);
    forgetting = null;
    await load();
  }
</script>

<div class="screen t-base">
  <Band plain onback={() => back('/')}>
    {#snippet title()}<h1 class="h">Players</h1>{/snippet}
  </Band>
  <main class="content flat">
    {#if rows.length}
      <p class="intro">Players here are suggested when you start a game. Forgetting someone keeps their name on past results.</p>
      <div class="card">
        {#each rows as r (r.player.id)}
          <div class="lrow">
            <Avatar player={r.player} />
            <span class="who"><b>{r.player.name}</b><small>{r.games ? `${plural(r.games, 'game')} · last ${fmtShort(r.lastPlayed!)}` : 'No games yet'}</small></span>
            <button class="ib" aria-label="Rename {r.player.name}" onclick={() => startRename(r.player)}><Icon name="edit" size={18} /></button>
            <button class="ib bad" aria-label="Forget {r.player.name}" onclick={() => (forgetting = r.player)}><Icon name="trash" size={18} /></button>
          </div>
        {/each}
      </div>
    {:else if loaded}
      <div class="card empty"><b>No players yet</b>Players you add to games will show up here.</div>
    {/if}
  </main>

  <Sheet open={forgetting !== null} onclose={() => (forgetting = null)} label="Forget player">
    {#if forgetting}
      <p class="q"><b>Forget {forgetting.name}?</b>They won't be suggested for new games. Past results keep their name. Typing their name in a new game brings them back.</p>
      <div class="row"><button class="cta soft" onclick={() => (forgetting = null)}>Cancel</button><button class="cta danger" onclick={confirmForget}>Forget</button></div>
    {/if}
  </Sheet>

  <Sheet open={renaming !== null} onclose={() => (renaming = null)} label="Rename player">
    {#if renaming}
      <form onsubmit={saveRename}>
        <p class="q"><b>Rename {renaming.name}</b>The new name shows everywhere, including past games.</p>
        <input class="field" bind:value={newName} maxlength="24" autocapitalize="words" aria-label="New name" />
        {#if error}<p class="err">{error}</p>{/if}
        <div class="row"><button type="button" class="cta soft" onclick={() => (renaming = null)}>Cancel</button><button type="submit" class="cta">Save</button></div>
      </form>
    {/if}
  </Sheet>
</div>

<style>
  .h { font: 800 32px var(--f-ui) !important; letter-spacing: -.02em; }
  .intro { margin: 0 6px 2px; font: 500 13.5px var(--f-ui); color: var(--p-muted); }
  .who { flex: 1; min-width: 0; display: flex; flex-direction: column; }
  .who b { font: 700 16px var(--f-ui); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .who small { font: 500 12.5px var(--f-ui); color: var(--p-muted); }
  .ib { width: 40px; height: 40px; border-radius: 50%; display: grid; place-items: center; color: var(--p-muted); flex: none; }
  .ib.bad { color: var(--p-bad); }
  .q { margin: 4px 4px 0; font: 500 14.5px var(--f-ui); color: var(--p-muted); }
  .q b { display: block; font: 800 18px var(--f-ui); color: var(--p-fg); margin-bottom: 4px; }
  form { display: flex; flex-direction: column; gap: 14px; }
  .field { height: 52px; border-radius: 14px; border: 0; padding: 0 14px; font: 600 17px var(--f-ui); background: var(--p-track); color: var(--p-fg); outline: none; }
  .field:focus { box-shadow: 0 0 0 2px var(--p-accent); background: var(--p-surface); }
  .err { margin: -6px 4px 0; font: 600 13px var(--f-ui); color: var(--p-bad); }
  .row { display: flex; gap: 10px; }
</style>
