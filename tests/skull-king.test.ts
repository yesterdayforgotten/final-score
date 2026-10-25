import { describe, expect, it } from 'vitest';
import { bonusCounts, emptyBonus, score, type SkEntry, type SkOptions } from '../src/games/skull-king/rules';

const classic: SkOptions = { scoring: 'classic', rounds: 10 };
const rascal: SkOptions = { scoring: 'rascal', rounds: 10 };

function e(bid: number | null, tricks: number | null, bonus: Partial<SkEntry['bonus']> = {}, cannonball = false): SkEntry {
  return { bid, tricks, bonus: { ...emptyBonus(), ...bonus }, cannonball };
}

// Round index is 0-based: index 3 is round 4 with 4 cards.
describe('classic scoring', () => {
  it('is null until bid and tricks are both entered', () => {
    expect(score(e(null, null), 0, classic)).toBeNull();
    expect(score(e(1, null), 0, classic)).toBeNull();
  });

  it('pays 20 per trick for a made bid', () => {
    expect(score(e(1, 1), 3, classic)).toBe(20);
    expect(score(e(3, 3), 6, classic)).toBe(60);
  });

  it('costs 10 per trick off for a missed bid', () => {
    expect(score(e(2, 4), 5, classic)).toBe(-20);
    expect(score(e(3, 0), 5, classic)).toBe(-30);
  });

  it('scores a zero bid at 10 x round number', () => {
    expect(score(e(0, 0), 3, classic)).toBe(40);
    expect(score(e(0, 1), 3, classic)).toBe(-40);
    expect(score(e(0, 3), 9, classic)).toBe(-100);
  });

  it('adds every bonus only when the bid is made', () => {
    const all = { std14: 2, black14: true, mermaids: 1, pirates: 2, skullKing: true, loot: 1 };
    // 20+20+20+60+40+20 = 180 bonus
    expect(score(e(2, 2, all), 5, classic)).toBe(40 + 180);
    expect(score(e(2, 3, all), 5, classic)).toBe(-10);
    expect(bonusCounts(e(2, 3, all), classic)).toBe(false);
  });

  it('matches the mockup round (Jules: bid 2, one 14 and one mermaid)', () => {
    expect(score(e(2, 2, { std14: 1, mermaids: 1 }), 3, classic)).toBe(70);
  });
});

describe('rascal scoring', () => {
  it('grapeshot: exact earns 10 per card dealt plus bonus', () => {
    expect(score(e(2, 2), 3, rascal)).toBe(40);
    expect(score(e(2, 2, { std14: 1 }), 3, rascal)).toBe(50);
    expect(score(e(0, 0), 3, rascal)).toBe(40);
  });

  it('grapeshot: off by one earns half, bonuses included', () => {
    expect(score(e(2, 3), 3, rascal)).toBe(20);
    expect(score(e(2, 1, { mermaids: 1 }), 3, rascal)).toBe(30);
    expect(score(e(1, 0), 2, rascal)).toBe(15);
  });

  it('grapeshot: off by two or more earns nothing', () => {
    expect(score(e(3, 1, { std14: 1 }), 5, rascal)).toBe(0);
  });

  it('cannonball: exact earns 15 per card dealt, any miss earns nothing', () => {
    expect(score(e(2, 2, {}, true), 3, rascal)).toBe(60);
    expect(score(e(2, 2, { loot: 1 }, true), 3, rascal)).toBe(80);
    expect(score(e(2, 3, {}, true), 3, rascal)).toBe(0);
  });

  it('never goes negative', () => {
    expect(score(e(5, 0), 9, rascal)).toBe(0);
  });
});
