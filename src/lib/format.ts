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

const segmenter = typeof Intl !== 'undefined' && 'Segmenter' in Intl ? new Intl.Segmenter(undefined, { granularity: 'grapheme' }) : null;

/** First visible character of a name: a whole emoji (with skin tone or ZWJ parts), not half of one. */
export function initial(name: string): string {
  const t = name.trim();
  if (!t) return '?';
  const first = segmenter ? (segmenter.segment(t)[Symbol.iterator]().next().value?.segment ?? '') : (Array.from(t)[0] ?? '');
  return first.toUpperCase() || '?';
}

/** True when the character is a pictograph (emoji) rather than a letter. */
export const isEmoji = (ch: string) => /\p{Extended_Pictographic}/u.test(ch);

export function plural(n: number, one: string, many = one + 's') {
  return `${n} ${n === 1 ? one : many}`;
}
