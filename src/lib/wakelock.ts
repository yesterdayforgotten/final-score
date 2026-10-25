/** Keep the screen on while a game is being scored. Silently does nothing where unsupported. */
export function keepAwake(): () => void {
  let lock: WakeLockSentinel | null = null;
  let active = true;
  const request = async () => {
    try {
      if (active && document.visibilityState === 'visible' && 'wakeLock' in navigator) lock = await navigator.wakeLock.request('screen');
    } catch {
      /* denied or unsupported */
    }
  };
  const onVis = () => void request();
  document.addEventListener('visibilitychange', onVis);
  void request();
  return () => {
    active = false;
    document.removeEventListener('visibilitychange', onVis);
    void lock?.release().catch(() => {});
  };
}
