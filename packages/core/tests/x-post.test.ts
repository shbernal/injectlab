import { chars } from 'charcheck';
import { describe, expect, it } from 'vitest';

import { buildDocument } from '../src/render/compose.js';
import { avatarColor, formatMetric, initials } from '../src/render/layouts/x-post.js';
import { xThemes } from '../src/render/platforms/x.js';
import { sourceOf } from '../src/render/render.js';
import { scanInject } from '../src/text/chars.js';
import type { XPostInject } from '../src/spec/types.js';

const POST: XPostInject = {
  kind: 'x-post',
  author: { name: 'Freight Watch UK', handle: 'freightwatchuk', verified: 'grey' },
  text: 'Hearing Northwind Logistics depots have been down since about 4am.',
  postedAt: '2026-08-12T07:05:00Z',
  metrics: { replies: 184, reposts: 1240, likes: 3820, views: 412_000 },
};

/** Keeps the golden snapshots about layout rather than about base64. */
function redactBlobs(document: string): string {
  return document.replaceAll(
    /(data:[\w/+-]+;base64,)[A-Za-z0-9+/=]+/gu,
    (_match, prefix: string) => `${prefix}REDACTED`,
  );
}

describe('formatMetric', () => {
  /** A post showing 12400 where every real one shows 12.4K is the first thing that looks wrong. */
  it('uses the compact notation the platform uses', () => {
    expect(formatMetric(184)).toBe('184');
    expect(formatMetric(1240)).toBe('1.2K');
    expect(formatMetric(12_400)).toBe('12.4K');
    expect(formatMetric(412_000)).toBe('412K');
    expect(formatMetric(1_200_000)).toBe('1.2M');
  });

  it('follows the locale', () => {
    expect(formatMetric(1_200_000, 'fr-FR')).toMatch(/1,2\s?M/u);
  });
});

describe('generated avatars', () => {
  it('are deterministic, because rendering is', () => {
    expect(avatarColor('freightwatchuk')).toBe(avatarColor('freightwatchuk'));
    expect(avatarColor('someoneelse')).not.toBe('');
  });

  it('come from a fixed readable palette, so white text is never on a light ground', () => {
    const colors = new Set(
      ['a', 'bb', 'ccc', 'freightwatchuk', 'zzz9'].map((handle) => avatarColor(handle)),
    );
    for (const color of colors) expect(color).toMatch(/^#[0-9a-f]{6}$/u);
  });

  it('take initials from the first two words', () => {
    expect(initials('Freight Watch UK')).toBe('FW');
    expect(initials('Someone')).toBe('S');
    expect(initials('  spaced   out  name ')).toBe('SO');
  });
});

describe('composing a post', () => {
  it('never touches the outlet registry, because a platform is not a publication', async () => {
    const document = await buildDocument(POST);
    expect(document).not.toContain('BBC');
    expect(document).not.toContain('Le Monde');
    expect(document).not.toContain('uk-masthead');
    expect(document).not.toContain('fr-masthead');
  });

  it('is named by its platform in the provenance, not by an outlet', () => {
    expect(sourceOf(POST)).toBe('x');
  });

  it('renders the author, the handle and the time', async () => {
    const document = await buildDocument(POST);
    expect(document).toContain('Freight Watch UK');
    expect(document).toContain('@freightwatchuk');
    expect(document).toContain('07:05');
  });

  it('renders metrics in compact notation', async () => {
    const document = await buildDocument(POST);
    expect(document).toContain('412K');
    expect(document).toContain('3.8K');
  });

  it('omits the metric row entirely when the spec gives none', async () => {
    const bare: XPostInject = { ...POST };
    delete bare.metrics;

    // The class name is also in the stylesheet, so this looks for the markup.
    expect(await buildDocument(bare)).not.toContain('class="x-metrics"');
  });

  it('draws a thread as connected posts in one image, with metrics only on the last', async () => {
    const document = await buildDocument({ ...POST, thread: ['Second', 'Third'] });

    expect([...document.matchAll(/class="x-post"/gu)]).toHaveLength(3);
    expect([...document.matchAll(/class="x-connector"/gu)]).toHaveLength(2);
    expect([...document.matchAll(/class="x-metrics"/gu)]).toHaveLength(1);
  });

  it('carries the same disclaimer band as an article, in the same style', async () => {
    const document = await buildDocument(POST);
    expect([...document.matchAll(/class="il-exercise il-exercise--/gu)]).toHaveLength(1);
    expect(document).toContain('class="il-exercise il-exercise--bold il-exercise--top"');
  });

  /**
   * The quiet style has no fill and borrows `--il-muted`, which the outlet themes define and
   * the platform palettes also had to. A post on the dark theme is where that would break.
   */
  it('keeps the quiet band legible on a dark post, by reading the platform palette', async () => {
    const document = await buildDocument({ ...POST, theme: 'dark' }, { disclaimerStyle: 'quiet' });
    expect(document).toContain('il-exercise--quiet');
    expect(document).toMatch(/--il-muted: #\w{6};/u);
  });

  it('makes no external reference', async () => {
    const document = await buildDocument(POST);
    expect(document).not.toContain('http://');
    expect(document).not.toContain('https://');
    expect(document).not.toContain('file://');
  });

  describe('escaping', () => {
    /** Post text is the field most likely to contain something hostile. */
    it('renders hostile post text as text', async () => {
      const document = await buildDocument({
        ...POST,
        text: '<script>alert(1)</script> & </style> "quoted"',
      });

      expect(document).not.toContain('<script>alert(1)</script>');
      expect([...document.matchAll(/<\/style>/gu)]).toHaveLength(1);
    });

    it('escapes the author name and every thread post', async () => {
      const document = await buildDocument({
        ...POST,
        author: { ...POST.author, name: '<b>spoofed</b>' },
        thread: ['<i>also</i>'],
      });

      expect(document).not.toContain('<b>spoofed</b>');
      expect(document).not.toContain('<i>also</i>');
    });
  });

  describe.each(xThemes())('the %s theme', (theme) => {
    it('matches its golden snapshot', async () => {
      await expect(redactBlobs(await buildDocument({ ...POST, theme }))).toMatchFileSnapshot(
        `./__snapshots__/x-post-${theme}.html`,
      );
    });
  });
});

describe('the character gate over a post', () => {
  it('covers the text, the thread and the author name', async () => {
    const findings = await scanInject({
      ...POST,
      author: { ...POST.author, name: `Freight ${chars.EM_DASH} Watch` },
      text: `Depots down ${chars.EM_DASH} drivers turned away`,
      thread: [`Update ${chars.ZERO_WIDTH_SPACE} two`],
    });

    expect(findings.map((finding) => finding.field).toSorted()).toEqual([
      'author.name',
      'text',
      'thread.0',
    ]);
  });
});
