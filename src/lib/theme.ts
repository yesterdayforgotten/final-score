let current: { light: string; dark: string } = { light: '#f2f3f6', dark: '#0e1117' };

/** Re-colour the browser/status bar for the current light/dark setting. */
export function refreshThemeColor() {
  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'theme-color';
    document.head.appendChild(meta);
  }
  meta.content = document.documentElement.dataset.theme === 'dark' ? current.dark : current.light;
}

/** Colour the browser/status bar to match the screen's header. */
export function setThemeColor(c: { light: string; dark: string }) {
  current = c;
  refreshThemeColor();
}

export const BASE_COLOR = { light: '#f2f3f6', dark: '#0e1117' };
