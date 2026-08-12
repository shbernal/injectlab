/**
 * Capture a live article as authoring material.
 *
 * This is the only thing in the project that touches a live news site, it is dev-only, it is
 * not part of any published package, and nothing imports it. The renderer never fetches
 * anything. The output of this tool is a starting point for a human or an agent writing an
 * outlet theme by hand, and it is never read at render time.
 *
 * Everything it writes lands in `.references/`, which is git-ignored, because it is
 * third-party content that must not be redistributed.
 *
 * Usage:
 *   node tools/capture-reference.mjs <url> --id bbc
 *   node tools/capture-reference.mjs <url> --id bbc --keep-open
 *   node tools/capture-reference.mjs <url> --id bbc --from-saved page.html
 *
 * The measurements come from `getComputedStyle` in a real engine rather than from parsing
 * CSS, which resolves the cascade, the custom properties and the responsive rules for free.
 *
 * `--from-saved` measures a page a human already has, for the outlets that answer an
 * automated visit with a bot challenge instead of an article. The saved markup is served as
 * the document at the real URL, so the stylesheets and fonts still resolve against the real
 * origin and the numbers are as real as a live capture. Scripts are blocked in this mode:
 * the saved markup is what the server sent, and running the page's own code would only
 * re-enter the challenge that made the file necessary. A Firefox "view source" save is
 * unwrapped automatically, since that is the one way to get the markup out of a page that
 * refuses to be automated.
 */

import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

import { chromium } from 'playwright';

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    id: { type: 'string' },
    'keep-open': { type: 'boolean', default: false },
    'from-saved': { type: 'string' },
  },
});

const url = positionals[0];
if (!url || !values.id) {
  console.error('Usage: node tools/capture-reference.mjs <url> --id <outlet-id>');
  console.error(
    '       node tools/capture-reference.mjs <url> --id <outlet-id> --from-saved <file>',
  );
  console.error('');
  console.error('The URL is required with --from-saved too: it is what the saved markup is');
  console.error('served as, so the stylesheets it names resolve, and it is the provenance.');
  process.exit(2);
}

const OUT = new URL(`../.references/${values.id}/`, import.meta.url);

const VIEWPORTS = {
  desktop: { width: 1280, height: 900 },
  mobile: { width: 390, height: 844 },
};

/**
 * Candidate selectors per role, tried in order. Deliberately generic: this is a hint
 * generator, not a scraper, and an outlet that matches none of these is a fine outcome as
 * long as it is reported rather than silently written as null.
 */
const ROLES = {
  headline: ['h1[class*="headline" i]', 'article h1', 'main h1', 'h1'],
  standfirst: [
    '[class*="standfirst" i]',
    '[class*="chapeau" i]',
    // Before the descendant form below, which otherwise matches the paragraph inside an
    // author "description" block and reports a reporter's name as the standfirst.
    'p[class*="desc" i]',
    '[class*="description" i] p',
    'article h2',
    'main h2',
  ],
  byline: ['[class*="byline" i]', '[rel="author"]', '[class*="author" i]'],
  section: [
    '[class*="section" i] a',
    'a[class*="section" i]',
    'nav [aria-current]',
    '[class*="kicker" i]',
  ],
  timestamp: ['time', '[class*="timestamp" i]', '[class*="date" i]'],
};

/**
 * Runs in the page. Returns the computed typography of the first selector that matches.
 *
 * Everything it needs has to be nested inside it. `page.evaluate` serialises this function
 * and nothing else, so a helper hoisted to module scope would be undefined by the time the
 * browser ran it.
 */
function measureRoles(roles) {
  // oxlint-disable-next-line consistent-function-scoping -- must stay inside, see above
  const describe = (element) => {
    const style = getComputedStyle(element);
    const box = element.getBoundingClientRect();
    return {
      selectorMatched: true,
      text: (element.textContent ?? '').trim().slice(0, 200),
      fontFamily: style.fontFamily,
      fontSize: style.fontSize,
      fontWeight: style.fontWeight,
      lineHeight: style.lineHeight,
      letterSpacing: style.letterSpacing,
      color: style.color,
      textTransform: style.textTransform,
      box: { width: Math.round(box.width), height: Math.round(box.height) },
      // The ancestor chain is what tells you whether the measure comes from the element or
      // from a wrapper, which is the question when reproducing a column width.
      ancestors: (() => {
        const chain = [];
        for (
          let node = element.parentElement;
          node && chain.length < 5;
          node = node.parentElement
        ) {
          const s = getComputedStyle(node);
          chain.push({
            tag: node.tagName.toLowerCase(),
            width: Math.round(node.getBoundingClientRect().width),
            maxWidth: s.maxWidth,
            padding: s.padding,
          });
        }
        return chain;
      })(),
    };
  };

  const result = {};
  for (const [role, selectors] of Object.entries(roles)) {
    result[role] = { selectorMatched: false };
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && (element.textContent ?? '').trim() !== '') {
        result[role] = { ...describe(element), selector };
        break;
      }
    }
  }

  const body = getComputedStyle(document.body);
  const rule = [...document.querySelectorAll('hr, [class*="divider" i]')][0];

  result.page = {
    background: body.backgroundColor,
    color: body.color,
    ruleColor: rule ? getComputedStyle(rule).borderTopColor : null,
    title: document.title,
    lang: document.documentElement.lang,
  };

  result.meta = Object.fromEntries(
    [...document.querySelectorAll('meta[property], meta[name]')]
      .map((m) => [m.getAttribute('property') ?? m.getAttribute('name'), m.getAttribute('content')])
      .filter(([key]) =>
        ['og:site_name', 'og:title', 'article:published_time', 'article:section'].includes(key),
      ),
  );

  // Inline SVG in the masthead region, for reference only. Never copied into an outlet file.
  const header = document.querySelector('header') ?? document.body;
  const svg = header.querySelector('svg');
  result.masthead = svg
    ? {
        inlineSvg: true,
        box: (() => {
          const b = svg.getBoundingClientRect();
          return { width: Math.round(b.width), height: Math.round(b.height) };
        })(),
        viewBox: svg.getAttribute('viewBox'),
        pathCount: svg.querySelectorAll('path').length,
      }
    : { inlineSvg: false };

  return result;
}

/**
 * The markup to serve as the document, or null for a live capture.
 *
 * A Firefox "view source" save is a syntax-highlighted rendering of the source, so the source
 * itself is the body's text. Unwrapping it through a real DOM rather than a regex keeps the
 * entity decoding exact, which matters for a French page where every other headline carries
 * an accent and a non-breaking space.
 */
async function readSavedDocument(file, browser) {
  const bytes = await readFile(file, 'utf8');
  if (!/<body[^>]*\bid="viewsource"/u.test(bytes)) return bytes;

  const page = await browser.newPage();
  await page.goto(pathToFileURL(file).href, { waitUntil: 'load', timeout: 120_000 });
  const source = await page.evaluate(() => document.body.textContent ?? '');
  await page.close();
  console.log(`unwrapped a view-source save: ${source.length} bytes of markup`);
  return source;
}

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({ headless: !values['keep-open'] });

const savedFile = values['from-saved'];
const savedHtml = savedFile ? await readSavedDocument(savedFile, browser) : null;

const notes = {
  url,
  capturedAt: new Date().toISOString(),
  // Provenance, because a reader of notes.json has to know whether a live visit produced
  // these numbers or a file a human saved by hand, and what was not running when they did.
  source:
    savedHtml === null
      ? { kind: 'live' }
      : { kind: 'saved-file', file: savedFile, scripts: 'blocked' },
  viewports: {},
};

for (const [name, viewport] of Object.entries(VIEWPORTS)) {
  const context = await browser.newContext({ viewport, locale: 'en-GB' });
  const page = await context.newPage();

  if (savedHtml !== null) {
    await page.route('**/*', (route) => {
      const request = route.request();
      if (request.resourceType() === 'script') return route.abort();
      // Only the document itself is served from the file. Stylesheets, fonts and images
      // still come from the real origin, which is what makes the measurements real.
      if (request.url() === url) {
        return route.fulfill({
          status: 200,
          contentType: 'text/html; charset=utf-8',
          body: savedHtml,
        });
      }
      return route.continue();
    });
  }

  await page.goto(url, { waitUntil: 'networkidle', timeout: 60_000 });
  // Consent dialogs cover the page and would be measured instead of the article.
  await page
    .getByRole('button', { name: /accept|agree|consent|continue/iu })
    .first()
    .click({ timeout: 3000 })
    .catch(() => {});

  const measured = await page.evaluate(measureRoles, ROLES);
  notes.viewports[name] = measured;

  // `path` wants a string, not a URL, and fails deep inside Playwright's mime sniffing if given one.
  await page.screenshot({
    path: fileURLToPath(new URL(`screenshot-${name}.png`, OUT)),
    fullPage: true,
  });
  if (name === 'desktop') await writeFile(new URL('page.html', OUT), await page.content());

  await context.close();
}

await writeFile(new URL('notes.json', OUT), `${JSON.stringify(notes, null, 2)}\n`);
await browser.close();

// A consent wall or a paywall produces a page with no headline. Saying so loudly beats
// writing an empty notes.json that someone later mistakes for "this outlet has no standfirst".
const missing = Object.entries(notes.viewports.desktop)
  .filter(([role, value]) => role in ROLES && value.selectorMatched !== true)
  .map(([role]) => role);

console.log(`wrote .references/${values.id}/`);
console.log(`  notes.json, page.html, screenshot-desktop.png, screenshot-mobile.png`);

if (missing.length > 0) {
  console.error('');
  console.error(`WARNING: no element matched for: ${missing.join(', ')}`);
  console.error('A consent wall, a paywall or an unusual template. Check screenshot-desktop.png');
  console.error('before trusting anything in notes.json.');
  process.exitCode = 1;
}
