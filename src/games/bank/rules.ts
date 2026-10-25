export interface BankOptions {
  rounds: number;
}

/** One roll of two dice. From the keypad after the safe rolls, Doubles is recorded without a total (sum 0). */
export interface Roll {
  sum: number;
  doubles: boolean;
  /** Faces, when rolled with the on-screen dice. */
  dice?: [number, number];
}

export interface BankRound {
  rolls: Roll[];
}

export interface BankEntry {
  /** Points locked in, or null if not banked. */
  banked: number | null;
  /** How many rolls had been made when they banked. */
  at: number | null;
  /** A 7 ended the round before they banked. */
  busted: boolean;
}

export const SAFE_ROLLS = 3;
export const SEVEN_BONUS = 70;
export const ROUND_CHOICES = [5, 10, 15, 20];

export const defaultOptions = (): BankOptions => ({ rounds: 10 });
export const emptyEntry = (): BankEntry => ({ banked: null, at: null, busted: false });
export const emptyRound = (): BankRound => ({ rolls: [] });

export interface BankState {
  bank: number;
  /** A 7 after the safe rolls ended the round. */
  sevened: boolean;
  count: number;
}

/**
 * Run the rolls: in the first three, a 7 adds 70 and anything else (doubles included) adds its total.
 * After that, doubles double the bank, other totals add, and a 7 ends the round with the bank lost.
 */
export function bankState(rolls: Roll[]): BankState {
  let bank = 0;
  let sevened = false;
  let count = 0;
  for (const r of rolls) {
    if (sevened) break;
    count++;
    if (count <= SAFE_ROLLS) bank += r.sum === 7 ? SEVEN_BONUS : r.sum;
    else if (r.sum === 7) {
      sevened = true;
      bank = 0;
    } else if (r.doubles) bank *= 2;
    else bank += r.sum;
  }
  return { bank, sevened, count };
}

export const rollFromDice = (a: number, b: number): Roll => ({ sum: a + b, doubles: a === b, dice: [a, b] });

export function score(e: BankEntry): number | null {
  if (e.banked !== null) return e.banked;
  return e.busted ? 0 : null;
}

export function rollLabel(r: Roll, index: number): string {
  if (index < SAFE_ROLLS) return r.sum === 7 ? '7 · +70' : String(r.sum);
  if (r.sum === 7) return '7';
  if (r.doubles) return r.sum ? `${r.sum} ×2` : '×2';
  return String(r.sum);
}
