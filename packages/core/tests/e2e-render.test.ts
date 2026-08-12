import { describe, expect, it } from 'vitest';

import { PlaywrightRenderer } from '../src/render/playwright.js';
import { pngSize, readProvenance } from '../src/render/provenance.js';
import { renderInject, targetFor } from '../src/render/render.js';
import type { NewsInject } from '../src/spec/types.js';

/**
 * The one test that launches a browser.
 *
 * Opt-in through `INJECTLAB_E2E=1`, because it needs a Chromium download that the ordinary
 * gate has no business requiring. Everything it can assert without a browser is asserted
 * elsewhere; what is left is that the real pipeline produces a real PNG.
 *
 * It never asserts pixel content. Font rasterisation differs across operating systems, so a
 * pixel snapshot would fail on CI for reasons that have nothing to do with the change under
 * test. Dimensions and metadata are the honest assertions.
 */
const enabled = process.env.INJECTLAB_E2E === '1';

const INJECT: NewsInject = {
  kind: 'news',
  outlet: 'bbc',
  section: 'Technology',
  headline: 'Northwind Logistics hit by ransomware, deliveries halted across the UK',
  standfirst: 'The haulier says its depots are running on paper.',
  byline: 'Helen Morrow',
  publishedAt: '2026-08-12T08:14:00Z',
  body: ['Northwind Logistics has taken its depot systems offline.'],
};

describe.runIf(enabled)('end to end, through headless Chromium', () => {
  it('renders a spec to a PNG of the expected size, carrying its provenance', async () => {
    const renderer = new PlaywrightRenderer();

    try {
      const { png } = await renderInject(INJECT, {
        renderer,
        target: { ...targetFor('card'), scale: 2 },
      });

      // `addProvenance` returns a plain Uint8Array, whose `toString` gives comma-separated
      // byte values rather than text.
      expect(String.fromCharCode(...png.subarray(1, 4))).toBe('PNG');
      // A `card` target is a fixed 1200 by 630, doubled by the scale factor.
      expect(pngSize(png)).toEqual({ width: 2400, height: 1260 });
      expect(readProvenance(png).Comment).toContain('SYNTHETIC EXERCISE MATERIAL');
    } finally {
      await renderer.close();
    }
  }, 120_000);

  it('reuses one browser across a full-page render as well', async () => {
    const renderer = new PlaywrightRenderer();

    try {
      const { png } = await renderInject(INJECT, { renderer });
      const { width, height } = pngSize(png);

      expect(width).toBe(2400);
      // Full page, so the height is whatever the article came to. Only that it is a real
      // page rather than an empty viewport is worth asserting.
      expect(height).toBeGreaterThan(1000);
    } finally {
      await renderer.close();
    }
  }, 120_000);
});

describe.skipIf(enabled)('end to end', () => {
  it('is skipped without INJECTLAB_E2E=1, which is why the gate needs no browser', () => {
    expect(enabled).toBe(false);
  });
});
