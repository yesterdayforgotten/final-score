import { describe, expect, it } from 'vitest';
import { initial, isEmoji } from '../src/lib/format';

describe('avatar initial', () => {
  it('uses the first letter, capitalised', () => {
    expect(initial(' maya')).toBe('M');
  });

  it('keeps a whole emoji instead of half of one', () => {
    expect(initial('🦊 Fox')).toBe('🦊');
    expect(initial('👍🏽 Sam')).toBe('👍🏽');
    expect(initial('👨‍👩‍👧 Family')).toBe('👨‍👩‍👧');
  });

  it('spots emoji', () => {
    expect(isEmoji('🦊')).toBe(true);
    expect(isEmoji('M')).toBe(false);
  });

  it('falls back to ? for an empty name', () => {
    expect(initial('  ')).toBe('?');
  });
});
