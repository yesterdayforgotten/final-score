import '@fontsource-variable/plus-jakarta-sans';
import '@fontsource/pirata-one';
import '@fontsource-variable/fredoka';
import '@fontsource/alfa-slab-one';
import './app.css';
import { mount } from 'svelte';
import App from './App.svelte';
import './lib/appearance.svelte';
import { route } from './lib/router.svelte';
import { initUpdates } from './lib/update.svelte';

initUpdates(() => route.path[0] === 'play');

export default mount(App, { target: document.getElementById('app')! });
