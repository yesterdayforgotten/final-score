import { haptics } from './haptics';

/**
 * Svelte action: call `onlong` after holding ~500 ms (or on right-click). A press that turned into a long
 * press doesn't also fire the element's click.
 */
export function longpress(node: HTMLElement, onlong: () => void) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let fired = false;
  let startX = 0;
  let startY = 0;

  const cancel = () => clearTimeout(timer);
  const fire = () => {
    fired = true;
    haptics.confirm();
    onlong();
  };

  function down(e: PointerEvent) {
    if (e.button !== 0) return;
    fired = false;
    startX = e.clientX;
    startY = e.clientY;
    timer = setTimeout(fire, 500);
  }
  function move(e: PointerEvent) {
    if (Math.hypot(e.clientX - startX, e.clientY - startY) > 10) cancel();
  }
  function click(e: MouseEvent) {
    if (fired) {
      e.preventDefault();
      e.stopImmediatePropagation();
      fired = false;
    }
  }
  function menu(e: MouseEvent) {
    e.preventDefault();
    cancel();
    if (!fired) fire();
  }

  node.addEventListener('pointerdown', down);
  node.addEventListener('pointermove', move);
  node.addEventListener('pointerup', cancel);
  node.addEventListener('pointercancel', cancel);
  node.addEventListener('pointerleave', cancel);
  node.addEventListener('click', click, true);
  node.addEventListener('contextmenu', menu);
  node.style.setProperty('-webkit-touch-callout', 'none');
  node.style.userSelect = 'none';

  return {
    update(next: () => void) {
      onlong = next;
    },
    destroy() {
      cancel();
      node.removeEventListener('pointerdown', down);
      node.removeEventListener('pointermove', move);
      node.removeEventListener('pointerup', cancel);
      node.removeEventListener('pointercancel', cancel);
      node.removeEventListener('pointerleave', cancel);
      node.removeEventListener('click', click, true);
      node.removeEventListener('contextmenu', menu);
    },
  };
}
