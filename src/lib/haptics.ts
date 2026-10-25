/**
 * Small haptic cues. Android browsers support navigator.vibrate; iOS Safari doesn't, so there we fall
 * back to toggling a hidden switch input, which iOS 18+ answers with a single system tick.
 */
type Pattern = number | number[];

let iosSwitch: HTMLLabelElement | null = null;

function iosTick() {
  if (!iosSwitch) {
    const label = document.createElement('label');
    label.setAttribute('aria-hidden', 'true');
    label.style.cssText = 'position:fixed;left:-9999px;width:1px;height:1px;overflow:hidden;';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.setAttribute('switch', '');
    input.tabIndex = -1;
    label.appendChild(input);
    document.body.appendChild(label);
    iosSwitch = label;
  }
  iosSwitch.click();
}

function buzz(p: Pattern) {
  try {
    if ('vibrate' in navigator) navigator.vibrate(p);
    else iosTick();
  } catch {
    /* unsupported */
  }
}

export const haptics = {
  /** Button press. */
  tap: () => buzz(8),
  /** Locking something in (banking). */
  confirm: () => buzz(15),
  /** Dice tumbling. */
  rattle: () => buzz([6, 45, 6, 45, 6, 45, 6, 45, 6]),
  /** An ordinary roll landing. */
  land: () => buzz(14),
  /** Doubles! */
  doubles: () => buzz([22, 60, 22, 60, 45]),
  /** A lucky bonus, like Bank's +70 seven. */
  bonus: () => buzz([20, 50, 20]),
  /** Round lost. */
  bust: () => buzz([90, 70, 180]),
};
