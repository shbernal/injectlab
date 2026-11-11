import { chars } from 'charcheck';
import { describe, expect, it } from 'vitest';

import { pngSize, readProvenance } from '../src/render/provenance.js';
import { renderAll, renderInject, targetFor } from '../src/render/render.js';
import type { Renderer, RenderTarget } from '../src/render/renderer.js';
import { CharPolicyError } from '../src/text/chars.js';
import type { NewsInject } from '../src/spec/types.js';
import { tinyPng } from './png-fixture.js';

const BASE: NewsInject = {
  kind: 'news',
  outlet: 'bbc',
  headline: 'Northwind Logistics hit by ransomware',
  publishedAt: '2026-08-12T08:14:00Z',
};

/** Stands in for a browser. Records what it was asked to draw, and draws nothing. */
class FakeRenderer implements Renderer {
  readonly calls: { html: string; target: RenderTarget }[] = [];
  closed = false;

  render(html: string, target: RenderTarget): Promise<Uint8Array> {
    this.calls.push({ html, target });
    return Promise.resolve(tinyPng(target.width * target.scale, 100));
  }

  close(): Promise<void> {
    this.closed = true;
    return Promise.resolve();
  }
}

describe('targetFor', () => {
  it('defaults to a full-page desktop capture at scale 2', () => {
    expect(targetFor()).toEqual({ width: 1200, scale: 2, format: 'png' });
  });

  it('gives mobile a phone width and no height', () => {
    expect(targetFor('mobile').height).toBeUndefined();
    expect(targetFor('mobile').width).toBe(390);
  });
});

describe('renderInject', () => {
  it('marks the PNG as synthetic exercise material', async () => {
    const renderer = new FakeRenderer();
    const { png } = await renderInject(BASE, { renderer, generatedFrom: 'acme.yaml' });
    const provenance = readProvenance(png);

    expect(provenance.Comment).toContain('SYNTHETIC EXERCISE MATERIAL');
    expect(provenance['injectlab.kind']).toBe('news');
    expect(provenance['injectlab.source']).toBe('bbc');
    expect(provenance['injectlab.generatedFrom']).toBe('acme.yaml');
    expect(provenance.Software).toMatch(/^injectlab \d+\.\d+\.\d+$/u);
  });

  /**
   * Not switchable, and this is the test that says so. The band serves the person looking at
   * the asset; the metadata serves whoever finds the file with no idea where it came from.
   */
  it('marks the PNG even when the visible disclaimer is turned off', async () => {
    const renderer = new FakeRenderer();
    const { png } = await renderInject(BASE, { renderer, disclaimer: 'none' });

    expect(readProvenance(png).Comment).toContain('SYNTHETIC EXERCISE MATERIAL');
    expect(renderer.calls[0]?.html).not.toContain('class="il-exercise');
  });

  it('renders at the variant the inject asks for', async () => {
    const renderer = new FakeRenderer();
    const { png } = await renderInject({ ...BASE, variant: 'card' }, { renderer });

    expect(renderer.calls[0]?.target).toEqual({
      width: 1200,
      height: 630,
      scale: 2,
      format: 'png',
    });
    expect(pngSize(png)).toEqual({ width: 2400, height: 100 });
  });

  describe('the character gate', () => {
    it('rejects before the renderer is ever called', async () => {
      const renderer = new FakeRenderer();
      const bad = { ...BASE, headline: `Offline ${chars.EM_DASH} regulator notified` };

      await expect(renderInject(bad, { renderer })).rejects.toBeInstanceOf(CharPolicyError);
      // The whole point of running the gate first: no browser was touched.
      expect(renderer.calls).toHaveLength(0);
    });

    it('reports and proceeds under warn', async () => {
      const renderer = new FakeRenderer();
      const bad = { ...BASE, headline: `Offline ${chars.EM_DASH} regulator notified` };
      const { findings } = await renderInject(bad, { renderer, chars: 'warn' });

      expect(findings).toHaveLength(1);
      expect(renderer.calls).toHaveLength(1);
    });

    it('scans the disclaimer as well as the inject', async () => {
      const renderer = new FakeRenderer();
      await expect(
        renderInject(BASE, { renderer, disclaimer: `Exercise ${chars.EM_DASH} not real` }),
      ).rejects.toBeInstanceOf(CharPolicyError);
    });

    it('skips the scan entirely under off', async () => {
      const renderer = new FakeRenderer();
      const bad = { ...BASE, headline: `Offline ${chars.EM_DASH} regulator notified` };
      const { findings } = await renderInject(bad, { renderer, chars: 'off' });

      expect(findings).toEqual([]);
      expect(renderer.calls).toHaveLength(1);
    });
  });
});

describe('renderAll', () => {
  const batch = Array.from({ length: 9 }, (_, index) => ({
    ...BASE,
    headline: `Story number ${index}`,
  }));

  it('renders every inject and preserves input order despite the concurrency', async () => {
    const renderer = new FakeRenderer();
    const results = await renderAll(batch, { renderer });

    expect(results).toHaveLength(9);
    expect(results.map((result) => result.index)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
    expect(
      results.map((result) => (result.inject.kind === 'news' ? result.inject.headline : '')),
    ).toEqual(batch.map((inject) => inject.headline));
  });

  it('reuses the one renderer for the whole batch', async () => {
    const renderer = new FakeRenderer();
    await renderAll(batch, { renderer });

    expect(renderer.calls).toHaveLength(9);
    // Batching is the caller's to close, not `renderAll`'s: the renderer may be reused.
    expect(renderer.closed).toBe(false);
  });

  it('does no work for an empty batch', async () => {
    const renderer = new FakeRenderer();
    expect(await renderAll([], { renderer })).toEqual([]);
    expect(renderer.calls).toHaveLength(0);
  });

  it('rejects the batch when one inject fails the gate', async () => {
    const renderer = new FakeRenderer();
    const withBad = [...batch, { ...BASE, headline: `Bad ${chars.EM_DASH} dash` }];

    await expect(renderAll(withBad, { renderer })).rejects.toBeInstanceOf(CharPolicyError);
  });
});
