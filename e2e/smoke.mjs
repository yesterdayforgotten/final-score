// End-to-end smoke test against the built app (npm run build && npx vite preview).
// Uses the system Chromium: CHROMIUM=/usr/bin/chromium node e2e/smoke.mjs [baseUrl] [shotDir]
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const base = process.argv[2] ?? 'http://localhost:4173/';
const shots = process.argv[3] ?? 'e2e/shots';
mkdirSync(shots, { recursive: true });

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? '/usr/bin/chromium', args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true, colorScheme: process.env.SCHEME ?? 'light' });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

// Centre the target first so the floating dock never covers it.
const tap = async (loc) => {
  await loc.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  try {
    await loc.click({ timeout: 5000 });
  } catch (e) {
    await page.screenshot({ path: `${shots}/FAIL.png` });
    console.log(await page.evaluate(() => { const c = document.querySelector('.content'); const s = document.querySelector('.screen').getBoundingClientRect(); const d = document.querySelector('.dock').getBoundingClientRect(); return JSON.stringify({ st: c.scrollTop, ch: c.clientHeight, sh: c.scrollHeight, wy: scrollY, dsh: document.documentElement.scrollHeight, ih: innerHeight, screenTop: s.top, screenH: s.height, dockTop: d.top, dockH: d.height, bodyST: document.body.scrollTop }); }));
    throw e;
  }
};
const shot = (name) => page.screenshot({ path: `${shots}/${name}.png` });
const expect = async (cond, msg) => { if (!(await cond)) throw new Error('FAILED: ' + msg); console.log('ok -', msg); };
const text = () => page.locator('body').innerText();

await page.goto(base);
await page.waitForSelector('text=Final Score');
await shot('01-home-empty');

// ---------- Skull King ----------
await page.getByRole('button', { name: /Skull King/ }).click();
await page.getByRole('button', { name: 'New game' }).click();
for (const n of ['Maya', 'Theo', 'Jules', 'Priya']) {
  await page.getByPlaceholder(/Player name|Add another player/).fill(n);
  await page.keyboard.press('Enter');
  await page.waitForSelector(`.seats >> text=${n}`);
}
await shot('02-sk-new');
await page.getByRole('button', { name: /Start game/ }).click();
await page.waitForSelector('text=Bids first');

async function skRound(bids, tricks, bonus) {
  for (const [name, b] of Object.entries(bids)) await tap(page.getByRole('radiogroup', { name: `${name}'s bid` }).getByRole('radio', { name: String(b), exact: true }));
  await page.getByRole('button', { name: 'Enter tricks' }).click();
  for (const [name, t] of Object.entries(tricks)) await tap(page.getByRole('radiogroup', { name: `${name}'s tricks` }).getByRole('radio', { name: String(t), exact: true }));
  if (bonus) await bonus();
}

// Round 1 (1 card): Maya bid 1 took 1 (+20), Theo 0/0 (+10), Jules 1/0 (−10), Priya 0/0 (+10)
await skRound({ Maya: 1, Theo: 0, Jules: 1, Priya: 0 }, { Maya: 1, Theo: 0, Jules: 0, Priya: 0 });
await page.getByRole('button', { name: /Next round/ }).click();
// Round 2 (2 cards): Jules bid 1 took 1 + Skull King taken by mermaid (+40) = 60
await page.waitForSelector('text=Round 2 of 10');
await skRound({ Maya: 1, Theo: 0, Jules: 1, Priya: 1 }, { Maya: 1, Theo: 0, Jules: 1, Priya: 0 }, async () => {
  await tap(page.locator('.pc', { hasText: 'Jules' }).getByRole('button', { name: /Bonuses/ }));
  await tap(page.getByRole('switch', { name: 'Skull King taken' }));
});
await shot('03-sk-tricks-bonus');
const totals = await page.locator('.tp .s').allInnerTexts();
await expect(JSON.stringify(totals) === JSON.stringify(['40', '30', '50', '0']), `SK totals after 2 rounds ${totals}`);
await page.getByRole('button', { name: /Next round/ }).click();
await page.waitForSelector('text=Round 3 of 10');
await page.getByRole('radiogroup', { name: "Maya's bid" }).getByRole('radio', { name: '2', exact: true }).click();
await shot('04-sk-bids-r3');

// Scoreboard, edit round 1, back
await page.getByRole('button', { name: 'Scoreboard' }).click();
await page.waitForSelector('table');
await shot('05-sk-board');
await page.locator('tbody tr').first().click();
await page.waitForSelector('text=Editing');
await tap(page.getByRole('radiogroup', { name: "Jules's tricks" }).getByRole('radio', { name: '1', exact: true }));
await tap(page.getByRole('radiogroup', { name: "Maya's tricks" }).getByRole('radio', { name: '0', exact: true }));
await page.getByRole('button', { name: 'Done' }).click();
await page.waitForSelector('text=Round 3 of 10');
const t2 = await page.locator('.tp .s').allInnerTexts();
await expect(JSON.stringify(t2) === JSON.stringify(['10', '30', '80', '0']), `SK totals after editing round 1 ${t2}`);

// Shorten the game mid-way: last round 4 cards
await page.getByRole('button', { name: 'More', exact: true }).click();
await page.getByRole('button', { name: 'Change number of rounds' }).click();
for (let i = 0; i < 7; i++) await page.locator('.bsheet').getByRole('button', { name: 'Fewer cards in the last round' }).click();
await expect(await page.locator('.bsheet').getByRole('button', { name: 'Fewer cards in the last round' }).isDisabled(), 'skull king last round cannot go below the current round');
await page.locator('.bsheet').getByRole('button', { name: 'Done' }).click();
await page.waitForSelector('text=Round 3 of 3');
await expect(true, 'skull king last round changed mid-game');

// End early -> result -> rematch
await page.getByRole('button', { name: 'Scoreboard' }).click();
await page.getByRole('button', { name: 'More', exact: true }).click();
await page.getByRole('button', { name: 'End game now' }).click();
await page.getByRole('button', { name: 'End game', exact: true }).click();
await page.waitForSelector('text=Final scores');
await page.waitForSelector('text=Jules wins');
await shot('06-sk-result');
await page.getByRole('button', { name: 'Rematch' }).click();
await page.waitForSelector('.seats >> text=Priya');
await expect((await page.locator('.seats .lrow').count()) === 4, 'rematch keeps 4 players');
// Rematch keeps the shortened game (last round 3); stretch it to 3–9.
for (let i = 0; i < 6; i++) await tap(page.getByRole('button', { name: 'More cards in the last round' }));
await tap(page.getByRole('button', { name: 'More cards in the first round' }));
await tap(page.getByRole('button', { name: 'More cards in the first round' }));
await expect((await text()).includes('9 cards each · 7 rounds in all'), 'skull king first/last card counts');
await shot('07a-sk-options');
await page.getByRole('button', { name: 'Cancel' }).click();
await page.waitForSelector('text=Past games');
await shot('07-sk-gamehome');

// ---------- Flip 7 ----------
await page.goto(base + '#/');
await page.getByRole('button', { name: /Flip 7/ }).click();
await page.getByRole('button', { name: 'New game' }).click();
// suggestion from Skull King players
await page.getByPlaceholder('Player name').fill('ma');
await page.waitForSelector('.sugg >> text=Maya');
await shot('08-f7-suggest');
await page.locator('.sugg').getByRole('button', { name: /Maya/ }).click();
await page.locator('.quick').getByRole('button', { name: /Theo/ }).click();
await page.getByPlaceholder('Add another player').fill('Sam');
await page.keyboard.press('Enter');
await page.waitForSelector('.seats >> text=Sam');
await page.getByRole('button', { name: /Start game/ }).click();
await page.waitForSelector('text=This round');

async function f7Round(scores) {
  for (const [name, v] of Object.entries(scores)) {
    if (v === 'bust') await tap(page.getByRole('button', { name: `${name} went bust` }));
    else await page.getByLabel(`${name}'s score`).fill(String(v));
  }
}
await f7Round({ Maya: 34, Theo: 'bust' });
// Sam uses the card picker: 0,1,3,5,6,8,9 = 32 + Flip 7 15 = 47
await tap(page.getByRole('button', { name: "Count Sam's cards" }));
for (const n of [0, 1, 3, 5, 6, 8, 9]) await page.locator('.deck').getByRole('button', { name: String(n), exact: true }).click();
await shot('09-f7-picker');
await page.getByRole('button', { name: 'Use 47' }).click();
await page.waitForSelector('text=Flip 7 +15');
await shot('10-f7-round');
await page.getByRole('button', { name: /Next round/ }).click();
for (let i = 0; i < 3; i++) {
  await page.waitForSelector(`text=Round ${i + 2} ·`);
  await f7Round({ Maya: 60, Theo: 20, Sam: 10 });
  const btn = page.getByRole('button', { name: /Next round|Finish game/ });
  await btn.click();
}
await page.waitForSelector('text=Final scores');
await page.waitForSelector('text=Maya wins');
await shot('11-f7-result');
const ft = await page.locator('.total').allInnerTexts();
await expect(JSON.stringify(ft) === JSON.stringify(['214', '77', '60']), `F7 final ${ft}`);


// ---------- Bank ----------
await page.goto(base + '#/');
await page.getByRole('button', { name: /^Bank/ }).click();
await page.getByRole('button', { name: 'New game' }).click();
await page.locator('.quick').getByRole('button', { name: /Maya/ }).click();
await page.locator('.quick').getByRole('button', { name: /Theo/ }).click();
await page.getByRole('button', { name: /Start game/ }).click();
await page.waitForSelector('text=Tap a player to bank');
await expect((await page.getByRole('radio', { name: 'My dice' }).getAttribute('aria-checked')) === 'true', 'bank defaults to your own dice');
await expect((await page.locator('.turn b').innerText()) === "Maya's roll", 'bank shows whose roll it is');
const key = (k) => page.locator('.keys, .keys2').getByRole('button', { name: k, exact: true });
await key('7 · +70').click();
await expect((await page.locator('.turn b').innerText()) === "Theo's roll", 'turn passes to the next player');
await key('5').click();
await key('6').click();
await expect((await page.locator('.amt').innerText()) === '81', 'bank: 7 is +70 in the safe rolls');
await page.locator('.pl', { hasText: 'Maya' }).click();
await expect(await page.locator('.keys').getByRole('button', { name: /12 is always doubles/ }).isDisabled(), '12 is disabled after the safe rolls (always doubles)');
await key('4').click();
await key('Doubles ×2').click();
await expect((await page.locator('.amt').innerText()) === '170', 'bank: doubles double after three rolls');
await shot('13-bank-keypad');
await page.locator('.pl', { hasText: 'Theo' }).click();
await page.waitForSelector('text=Everyone banked');
const bt = await page.locator('.tp .s').allInnerTexts();
await expect(JSON.stringify(bt) === JSON.stringify(['81', '170']), `bank totals ${bt}`);
await page.getByRole('button', { name: /Next round/ }).click();
await page.waitForSelector('text=Round 2 of 10');
await page.getByRole('button', { name: 'More', exact: true }).click();
await page.getByRole('button', { name: 'Change number of rounds' }).click();
await page.locator('.bsheet').getByRole('button', { name: '15', exact: true }).click();
await shot('13a-bank-rounds');
await page.locator('.bsheet').getByRole('button', { name: 'Done' }).click();
await page.waitForSelector('text=Round 2 of 15');
await expect(true, 'bank rounds changed mid-game');
await page.getByRole('radio', { name: 'On-screen dice' }).click();
await page.getByRole('button', { name: /Roll the dice/ }).click();
await page.waitForTimeout(900);
await expect((await page.locator('.hist .rc').count()) === 1, 'on-screen dice records a roll');
await shot('14-bank-dice');

// ---------- offline ----------
await page.goto(base + '#/');
await page.waitForTimeout(1500);
await ctx.setOffline(true);
await page.reload();
await page.waitForSelector('text=Final Score');
await page.getByRole('button', { name: /Flip 7/ }).click();
await expect(page.waitForSelector('text=Past games').then(() => true), 'works offline with saved history');
await shot('12-offline-f7home');

await expect(errors.length === 0, `no console errors ${errors.join(' | ')}`);
await browser.close();
