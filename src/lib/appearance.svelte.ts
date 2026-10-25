import { refreshThemeColor } from './theme';

export type Mode = 'system' | 'light' | 'dark';

const KEY = 'fs.appearance';
const mq = window.matchMedia('(prefers-color-scheme: dark)');

function read(): Mode {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'light' || v === 'dark' ? v : 'system';
  } catch {
    return 'system';
  }
}

/** Light/dark choice for this device; 'system' follows the phone. */
export const appearance = $state({ mode: read(), dark: false });

function apply() {
  appearance.dark = appearance.mode === 'dark' || (appearance.mode === 'system' && mq.matches);
  document.documentElement.dataset.theme = appearance.dark ? 'dark' : 'light';
  refreshThemeColor();
}

export function setMode(m: Mode) {
  appearance.mode = m;
  try {
    if (m === 'system') localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, m);
  } catch {
    /* private mode */
  }
  apply();
}

/** Flip between light and dark (an explicit choice, no longer following the phone). */
export const toggleDark = () => setMode(appearance.dark ? 'light' : 'dark');

mq.addEventListener('change', apply);
apply();
