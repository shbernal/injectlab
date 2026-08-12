/**
 * Slice 0. Throwaway.
 *
 * Answers three questions before any structure is built on top of headless rendering:
 *
 *   1. Do `data:` URI WOFF2 fonts load before the screenshot fires, or is an explicit
 *      `document.fonts.ready` await needed?
 *   2. Does `page.setContent` plus `waitUntil: 'load'` suffice with no network at all?
 *   3. What does a full-page screenshot cost, cold and warm?
 *
 * Delete this file in the commit that lands the real renderer.
 *
 * Run: node tools/spike-render.mjs   (after node tools/fetch-spike-fonts.mjs)
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';

import { chromium } from 'playwright';

const RUNS = 5;
const WIDTH = 1200;
const FONT_DIR = new URL('../.references/fonts/', import.meta.url);
const OUT_DIR = new URL('../out/', import.meta.url);

async function dataUri(file) {
  const bytes = await readFile(new URL(file, FONT_DIR));
  return `data:font/woff2;base64,${bytes.toString('base64')}`;
}

const fonts = {
  sans400: await dataUri('libre-franklin-400.woff2'),
  sans700: await dataUri('libre-franklin-700.woff2'),
  serif400: await dataUri('lora-400.woff2'),
  serif700: await dataUri('lora-700.woff2'),
};

// Deliberately BBC-shaped rather than BBC-accurate. The point is to exercise a real
// masthead-plus-headline-plus-body layout with two embedded families, not to be a theme.
const html = `<!doctype html>
<html lang="en-GB"><head><meta charset="utf-8"><title>spike</title><style>
@font-face { font-family: 'IL Sans'; src: url(${fonts.sans400}) format('woff2'); font-weight: 400; font-display: block; }
@font-face { font-family: 'IL Sans'; src: url(${fonts.sans700}) format('woff2'); font-weight: 700; font-display: block; }
@font-face { font-family: 'IL Serif'; src: url(${fonts.serif400}) format('woff2'); font-weight: 400; font-display: block; }
@font-face { font-family: 'IL Serif'; src: url(${fonts.serif700}) format('woff2'); font-weight: 700; font-display: block; }
*, *::before, *::after { box-sizing: border-box; }
body { margin: 0; background: #fff; color: #141414; font-family: 'IL Serif', Georgia, serif; }
.exercise { background: #ffd400; color: #000; border-bottom: 3px solid #b80000;
  font-family: 'IL Sans', Arial, sans-serif; font-weight: 700; font-size: 20px;
  letter-spacing: .14em; text-transform: uppercase; text-align: center; padding: 14px 8px; }
.masthead { border-bottom: 1px solid #d9d9d9; padding: 14px 40px; display: flex; align-items: center; gap: 18px; }
.wordmark { font-family: 'IL Sans', Arial, sans-serif; font-weight: 700; font-size: 26px;
  letter-spacing: -.02em; background: #141414; color: #fff; padding: 4px 12px; }
.nav { font-family: 'IL Sans', Arial, sans-serif; font-size: 15px; color: #3f3f3f; display: flex; gap: 22px; }
main { max-width: 780px; padding: 34px 40px 60px; }
h1 { font-family: 'IL Serif', Georgia, serif; font-weight: 700; font-size: 46px; line-height: 1.1; margin: 0 0 18px; }
.standfirst { font-family: 'IL Sans', Arial, sans-serif; font-size: 21px; line-height: 1.45; color: #3f3f3f; margin: 0 0 26px; }
.byline { font-family: 'IL Sans', Arial, sans-serif; font-size: 15px; border-top: 1px solid #ebebeb;
  border-bottom: 1px solid #ebebeb; padding: 14px 0; margin: 0 0 26px; }
.byline strong { font-weight: 700; }
.byline span { color: #6e6e6e; }
figure { margin: 0 0 26px; }
.photo { width: 100%; height: 380px; background: linear-gradient(120deg, #2b3a4a, #63788c); }
figcaption { font-family: 'IL Sans', Arial, sans-serif; font-size: 13px; color: #6e6e6e; padding-top: 8px; }
p.body { font-size: 19px; line-height: 1.6; margin: 0 0 20px; }
#probe { position: absolute; left: -9999px; font-family: 'IL Serif'; font-size: 100px; }
</style></head><body>
<div class="exercise">[Exercise, Exercise, Exercise]</div>
<header class="masthead"><div class="wordmark">NEWS</div>
  <nav class="nav"><span>Home</span><span>UK</span><span>Business</span><span>Technology</span></nav></header>
<main>
  <h1>Northgate Utilities says billing systems offline after cyber attack</h1>
  <p class="standfirst">The company has told customers not to attempt payments while it works to
    restore service, and says it has notified the regulator.</p>
  <div class="byline"><strong>By Helen Morrow</strong><br><span>Business reporter, 09:14</span></div>
  <figure><div class="photo"></div>
    <figcaption>Northgate said the incident was detected early on Tuesday morning</figcaption></figure>
  <p class="body">Northgate Utilities has taken its customer billing platform offline after what it
    described as a significant cyber attack, leaving several hundred thousand account holders unable
    to view statements or make payments.</p>
  <p class="body">In a short statement the company said it had isolated the affected systems as a
    precaution and had engaged external incident responders. It would not say whether customer data
    had been accessed.</p>
  <p class="body">The regulator confirmed it had been notified and said it was in contact with the
    company. Industry figures said the timing, days before a quarterly billing run, was likely to
    compound the disruption.</p>
</main>
<span id="probe">Hamburgefonstiv</span>
</body></html>`;

/** Measures a probe rendered in the embedded serif. A fallback face gives a different width. */
const measure = () => ({
  status: document.fonts.status,
  probe: Math.round(document.getElementById('probe').getBoundingClientRect().width),
});

await mkdir(OUT_DIR, { recursive: true });

const requests = [];
const timings = [];
let byteVerdict = null;
let firstFrame = null;

const t0 = performance.now();
const browser = await chromium.launch({
  args: ['--force-color-profile=srgb', '--font-render-hinting=none'],
});
const launchMs = performance.now() - t0;

const context = await browser.newContext({
  viewport: { width: WIDTH, height: 900 },
  deviceScaleFactor: 2,
  colorScheme: 'light',
  reducedMotion: 'reduce',
  locale: 'en-GB',
});

// Question 2: prove the page makes no request of any kind, rather than assuming it.
await context.route('**/*', (route) => {
  requests.push(route.request().url());
  return route.abort();
});

for (let i = 0; i < RUNS; i++) {
  const page = await context.newPage();

  const tSet = performance.now();
  await page.setContent(html, { waitUntil: 'load' });
  const setMs = performance.now() - tSet;

  // Question 1: state and geometry the instant `load` resolves, before any font await.
  const before = await page.evaluate(measure);
  const tShotA = performance.now();
  const shotA = await page.screenshot({ fullPage: true });
  const shotAMs = performance.now() - tShotA;

  await page.evaluate(() => document.fonts.ready);
  const after = await page.evaluate(measure);
  const tShotB = performance.now();
  const shotB = await page.screenshot({ fullPage: true });
  const shotBMs = performance.now() - tShotB;

  const identical = Buffer.compare(shotA, shotB) === 0;
  timings.push({ setMs, shotAMs, shotBMs, before, after, identical });
  if (byteVerdict === null || byteVerdict === true) byteVerdict = identical;
  firstFrame ??= { shotA, shotB };

  await page.close();
}

// Is `waitUntil: 'load'` what makes the fonts ready, or were they never going to race?
// Re-run against the weakest wait Playwright offers, which is what would expose a race.
const domOnly = [];
for (let i = 0; i < RUNS; i++) {
  const page = await context.newPage();
  await page.setContent(html, { waitUntil: 'domcontentloaded' });
  domOnly.push(await page.evaluate(measure));
  await page.close();
}

// Question 3 exists to settle whether batch rendering needs a persistent browser. The
// screenshot, not the launch, turned out to dominate, so measure what actually helps:
// eight assets sequentially against eight at a concurrency of four.
async function shoot() {
  const page = await context.newPage();
  await page.setContent(html, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ fullPage: true });
  await page.close();
}

const tSeq = performance.now();
for (let i = 0; i < 8; i++) await shoot();
const seqMs = performance.now() - tSeq;

const tPar = performance.now();
const queue = Array.from({ length: 8 }, (_, i) => i);
await Promise.all(
  Array.from({ length: 4 }, async () => {
    while (queue.length) {
      queue.pop();
      await shoot();
    }
  }),
);
const parMs = performance.now() - tPar;

await writeFile(new URL('spike.png', OUT_DIR), firstFrame.shotB);
await writeFile(new URL('spike-no-font-await.png', OUT_DIR), firstFrame.shotA);

const round = (n) => Math.round(n);
console.log(`browser launch (cold):      ${round(launchMs)} ms`);
console.log('');
console.log(
  'run  setContent  shotA  shotB  fonts.status(before/after)  probe(before/after)  same bytes',
);
timings.forEach((t, i) => {
  console.log(
    `${String(i + 1).padStart(3)}  ${String(round(t.setMs)).padStart(9)}  ` +
      `${String(round(t.shotAMs)).padStart(5)}  ${String(round(t.shotBMs)).padStart(5)}  ` +
      `${(t.before.status + '/' + t.after.status).padStart(26)}  ` +
      `${(t.before.probe + '/' + t.after.probe).padStart(19)}  ${String(t.identical).padStart(10)}`,
  );
});
console.log('');
console.log(
  `domcontentloaded only:       ${domOnly.map((d) => `${d.status}:${d.probe}`).join(' ')}`,
);
console.log(`8 assets sequential:         ${round(seqMs)} ms  (${round(seqMs / 8)} ms each)`);
console.log(`8 assets, concurrency 4:     ${round(parMs)} ms  (${round(parMs / 8)} ms each)`);
console.log(
  `network requests attempted:  ${requests.length}${requests.length ? ' ' + JSON.stringify(requests) : ''}`,
);
console.log(`screenshots identical every run: ${byteVerdict}`);
console.log(`html size: ${(html.length / 1024).toFixed(0)} KiB`);

await context.close();
await browser.close();
