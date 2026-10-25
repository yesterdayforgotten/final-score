<script lang="ts">
  import { appearance, toggleDark } from '../lib/appearance.svelte';
  import Icon from './Icon.svelte';
</script>

<button class="ibtn" aria-label={appearance.dark ? 'Switch to light mode' : 'Switch to dark mode'} onclick={toggleDark}>
  <Icon name={appearance.dark ? 'sun' : 'moon'} />
</button>
