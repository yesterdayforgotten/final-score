import { registerSW } from 'virtual:pwa-register';

/** True when a new version is downloaded but we're holding it back (mid-game). */
export const update = $state({ ready: false });

let applyFn: ((reload?: boolean) => Promise<void>) | undefined;
let isBusy: () => boolean = () => false;

const HOUR = 60 * 60 * 1000;

/**
 * Check for a new version on launch, on returning to the app and hourly.
 * Apply it right away unless `busy()` says a game is on screen; then wait for a tap or for the player to leave.
 */
export function initUpdates(busy: () => boolean) {
  isBusy = busy;
  if (!('serviceWorker' in navigator)) return;
  applyFn = registerSW({
    immediate: true,
    onNeedRefresh() {
      if (isBusy()) update.ready = true;
      else void applyFn?.(true);
    },
    onRegisteredSW(_url, reg) {
      if (!reg) return;
      const check = () => {
        if (navigator.onLine) reg.update().catch(() => {});
      };
      setInterval(check, HOUR);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') check();
      });
    },
  });
}

export function applyUpdate() {
  update.ready = false;
  void applyFn?.(true);
}
