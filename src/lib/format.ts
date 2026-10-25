const dayFmt = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
const shortFmt = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });
const timeFmt = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });

export const fmtDay = (t: number) => dayFmt.format(t);
export const fmtShort = (t: number) => shortFmt.format(t);
export const fmtTime = (t: number) => timeFmt.format(t);

export function fmtDuration(ms: number): string {
  const m = Math.max(1, Math.round(ms / 60000));
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  return m % 60 ? `${h} h ${m % 60} min` : `${h} h`;
}

export const signed = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '0');

export const deltaClass = (n: number) => (n > 0 ? 'pos' : n < 0 ? 'neg' : 'zero');

export const initial = (name: string) => (name.trim()[0] ?? '?').toUpperCase();

export function plural(n: number, one: string, many = one + 's') {
  return `${n} ${n === 1 ? one : many}`;
}
