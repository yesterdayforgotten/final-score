/** Tiny hash router: #/path/parts?query */
export const route = $state({ path: [] as string[], query: new URLSearchParams() });

const current = () => location.hash.replace(/^#/, '') || '/';

/** Our own mirror of the in-app history, so "up" buttons can tell when going back is the same as going up. */
const stack: string[] = [current()];
let ours = false;

function parse() {
  const [p, q] = current().split('?');
  route.path = p.split('/').filter(Boolean).map(decodeURIComponent);
  route.query = new URLSearchParams(q ?? '');
}

window.addEventListener('hashchange', () => {
  const h = current();
  if (ours) {
    ours = false;
  } else if (stack.length > 1 && stack[stack.length - 2] === h) {
    stack.pop(); // browser/system back
  } else {
    stack.push(h); // forward, or a typed URL
  }
  parse();
});
parse();

export function go(path: string, opts: { replace?: boolean } = {}) {
  if (path === current()) return;
  ours = true;
  if (opts.replace) {
    stack[stack.length - 1] = path;
    location.replace('#' + path);
  } else {
    stack.push(path);
    location.hash = path;
  }
}

/** Go up to `parent`: a real history step back when that's where we came from, otherwise replace. */
export function back(parent = '/') {
  if (stack.length > 1 && stack[stack.length - 2] === parent) {
    stack.pop();
    ours = true;
    history.back();
  } else {
    go(parent, { replace: true });
  }
}
