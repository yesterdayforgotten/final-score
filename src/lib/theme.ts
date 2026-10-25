const dark = window.matchMedia('(prefers-color-scheme: dark)');

let current: { light: string; dark: string } = { light: '#f2f3f6', dark: '#0e1117' };

function apply() {
  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'theme-color';
    document.head.appendChild(meta);
  }
  meta.content = dark.matches ? current.dark : current.light;
}

dark.addEventListener('change', apply);

/** Colour the browser/status bar to match the screen's header. */
export function setThemeColor(c: { light: string; dark: string }) {
  current = c;
  apply();
}

export const BASE_COLOR = { light: '#f2f3f6', dark: '#0e1117' };
