import { chars } from 'charcheck';
import { describe, expect, it } from 'vitest';

import { getOutlet } from '../src/outlets/registry.js';
import type { Outlet } from '../src/outlets/types.js';
import { buildDocument } from '../src/render/compose.js';
import {
  DEFAULT_DISCLAIMER,
  DISCLAIMER_CSS,
  DISCLAIMER_STYLES,
  NO_DISCLAIMER,
} from '../src/render/disclaimer.js';
import { toHtmlString } from '../src/render/html.js';
import { frOnlineDaily } from '../src/render/layouts/fr-online-daily.js';
import { buildView } from '../src/render/view.js';
import type { NewsInject } from '../src/spec/types.js';

/**
 * The style and position modifiers on each band drawn, in document order.
 *
 * Matched on the markup rather than counted across the whole document, since the same class
 * names appear again in the stylesheet, where all three styles are always defined.
 */
function bands(document: string): string[] {
  return [...document.matchAll(/class="il-exercise ([^"]*)"/gu)].map((match) => match[1] ?? '');
}

/** Keeps the golden snapshots about layout rather than about base64. */
function redactBlobs(document: string): string {
  return document.replaceAll(
    /(data:[\w/+-]+;base64,)[A-Za-z0-9+/=]+/gu,
    (_match, prefix: string) => `${prefix}REDACTED`,
  );
}

/** Written before Le Monde existed, and kept: the daily's snapshot answers for the layout. */
function frenchFixture(): Outlet {
  const bbc = getOutlet('bbc');
  return {
    ...bbc,
    id: 'fixture-fr',
    name: 'Le Quotidien',
    country: 'fr',
    locale: 'fr-FR',
    timeZone: 'Europe/Paris',
    layout: 'fr-online-daily',
    domain: 'example.fr',
    theme: { ...bbc.theme, masthead: { kind: 'wordmark', source: 'Le Quotidien' } },
    conventions: {
      navSections: ['International', 'Politique', 'Economie'],
      dateFormat: 'fr-long',
      bylinePrefix: 'Par ',
      sectionDefault: 'Economie',
      headlineCase: 'sentence',
      updatedLabel: 'Publié le',
    },
  };
}

const FIXED: NewsInject = {
  kind: 'news',
  outlet: 'bbc',
  section: 'Technology',
  headline: 'Northwind Logistics hit by ransomware, deliveries halted across the UK',
  standfirst:
    'The haulier says its depots are running on paper and that it has notified the regulator.',
  byline: 'Helen Morrow',
  publishedAt: '2026-08-12T08:14:00Z',
  body: [
    'Northwind Logistics has taken its depot systems offline after a ransomware attack.',
    'The company said it had engaged external incident responders.',
  ],
};

describe('buildDocument', () => {
  it('produces the same string twice, which is the determinism requirement', async () => {
    expect(await buildDocument(FIXED)).toBe(await buildDocument(FIXED));
  });

  /**
   * The golden snapshot. This is the real regression net for the layouts: anything that
   * changes what is drawn changes this string, and the diff is readable in a way a pixel
   * comparison is not.
   *
   * Embedded blobs are redacted first. Left in, the file is 95 KB of base64, the diff is
   * unreadable, and refreshing a font would rewrite it for reasons that have nothing to do
   * with layout. That the fonts are embedded at all is asserted separately, just below.
   */
  it('matches the golden snapshot for the UK layout', async () => {
    await expect(redactBlobs(await buildDocument(FIXED))).toMatchFileSnapshot(
      './__snapshots__/uk-online-broadsheet.html',
    );
  });

  /**
   * The French layout is exercised through the layout function directly, because the outlet
   * that uses it is authored later. Running the BBC theme through it is not a mistake: it is
   * what the theme and layout split is for, and a different arrangement of the same data is
   * exactly what the snapshot should show.
   */
  it('matches the golden snapshot for the French layout', async () => {
    const view = await buildView(FIXED, frenchFixture());
    await expect(toHtmlString(frOnlineDaily(view))).toMatchFileSnapshot(
      './__snapshots__/fr-online-daily.html',
    );
  });

  /**
   * The freesheet family goes through the whole composer rather than the layout function
   * alone, because the outlet that uses it is authored and there is no reason to fake it. The
   * story is the UK one on purpose: what the snapshot is for is the arrangement and the
   * theme, and holding the copy fixed across the three families is what makes them
   * comparable.
   */
  it('matches the golden snapshot for the French freesheet layout', async () => {
    const document = await buildDocument({ ...FIXED, outlet: '20minutes' });
    await expect(redactBlobs(document)).toMatchFileSnapshot(
      './__snapshots__/fr-online-freesheet.html',
    );
  });

  describe('self-containment', () => {
    it('makes no external reference of any kind', async () => {
      const document = await buildDocument(FIXED);

      // The `data:` URIs are the only place these substrings may legitimately appear, and
      // they do not contain them, so a bare search is the whole assertion.
      expect(document).not.toContain('http://');
      expect(document).not.toContain('https://www.bbc');
      expect(document).not.toContain('file://');
      expect(document).not.toContain('//fonts.g');
    });

    it('embeds every font as a data URI', async () => {
      const document = await buildDocument(FIXED);
      const faces = [...document.matchAll(/@font-face/gu)].length;
      const embedded = [...document.matchAll(/url\(data:font\/woff2;base64,/gu)].length;

      expect(faces).toBeGreaterThan(0);
      expect(embedded).toBe(faces);
    });
  });

  describe('escaping', () => {
    it('renders a hostile headline as text', async () => {
      const document = await buildDocument({
        ...FIXED,
        headline: `<script>alert(1)</script> & </style> "quoted"`,
      });

      expect(document).not.toContain('<script>alert(1)</script>');
      expect(document).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
      // One `</style>` only, the real one that closes the stylesheet.
      expect([...document.matchAll(/<\/style>/gu)]).toHaveLength(1);
    });

    it('escapes a hostile byline, section and body paragraph too', async () => {
      const document = await buildDocument({
        ...FIXED,
        byline: '<b>x</b>',
        section: '<i>y</i>',
        body: ['<u>z</u>'],
      });

      for (const tag of ['<b>x</b>', '<i>y</i>', '<u>z</u>']) {
        expect(document).not.toContain(tag);
      }
    });
  });

  describe('the disclaimer', () => {
    it('renders one band at the top by default', async () => {
      const document = await buildDocument(FIXED);
      expect(bands(document)).toEqual(['il-exercise--bold il-exercise--top']);
      expect(document).toContain('[EXERCISE, EXERCISE, EXERCISE]');
    });

    it('takes an override', async () => {
      const document = await buildDocument(FIXED, { disclaimer: 'TRAINING MATERIAL ONLY' });
      expect(document).toContain('TRAINING MATERIAL ONLY');
      expect(document).not.toContain('[EXERCISE, EXERCISE, EXERCISE]');
    });

    it('omits the band when turned off, and changes nothing else', async () => {
      const on = await buildDocument(FIXED);
      const off = await buildDocument(FIXED, { disclaimer: NO_DISCLAIMER });

      expect(off).not.toContain('class="il-exercise');
      expect(off.length).toBeLessThan(on.length);
      expect(off).toContain(FIXED.headline);
    });

    it('draws the loud style at both ends, which is the point of it', async () => {
      const document = await buildDocument(FIXED, { disclaimerStyle: 'band' });
      expect(bands(document)).toEqual([
        'il-exercise--band il-exercise--top',
        'il-exercise--band il-exercise--bottom',
      ]);
    });

    it('draws the quiet style once, at the top', async () => {
      const document = await buildDocument(FIXED, { disclaimerStyle: 'quiet' });
      expect(bands(document)).toEqual(['il-exercise--quiet il-exercise--top']);
    });

    /**
     * The styles differ in how they are drawn and in nothing else. A preset that quietly
     * softened the wording as well would be a way of making an asset harder to identify as
     * synthetic, which is the one thing the framing may not do.
     */
    it('says the same words in every style', async () => {
      for (const style of DISCLAIMER_STYLES) {
        const document = await buildDocument(FIXED, { disclaimerStyle: style });
        expect(document).toContain(`>${DEFAULT_DISCLAIMER}</div>`);
      }
    });

    /** Two of the three have no fill, so they inherit whatever the page is. */
    it('reads the page palette for the quiet style, and never for the loud one', () => {
      expect(DISCLAIMER_CSS).toMatch(/\.il-exercise--quiet \{[^}]*var\(--il-muted\)/u);
      expect(DISCLAIMER_CSS).not.toMatch(/\.il-exercise--bold \{[^}]*var\(/u);
    });
  });

  describe('outlet conventions', () => {
    it('writes the timestamp in the outlet time zone, not the host one', async () => {
      // 08:14 UTC is 09:14 in London, and the fixture is a London outlet.
      expect(await buildDocument(FIXED)).toContain('Published 12 August 2026, 09:14');
    });

    it('applies the outlet byline prefix', async () => {
      expect(await buildDocument(FIXED)).toContain('By Helen Morrow');
    });

    it('falls back to the outlet default section', async () => {
      const withoutSection: NewsInject = { ...FIXED };
      delete withoutSection.section;

      const document = await buildDocument(withoutSection);
      expect(document).toContain(getOutlet('bbc').conventions.sectionDefault);
    });

    it('marks the document in the outlet locale', async () => {
      expect(await buildDocument(FIXED)).toContain('lang="en-GB"');
    });
  });

  it('does not sanitise banned characters, since the gate rejects them earlier', async () => {
    // Composition is not the place this is caught, and quietly fixing it here would hide a
    // spec that needs editing.
    const document = await buildDocument({ ...FIXED, headline: `A ${chars.EM_DASH} b` });
    expect(document).toContain(chars.EM_DASH);
  });
});
