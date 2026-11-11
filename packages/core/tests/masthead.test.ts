import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { buildDocument } from '../src/render/compose.js';
import {
  RemoteAssetError,
  RemoteNotPermittedError,
  fetchRemoteImage,
  prefetchRemoteAssets,
  remoteUrlsIn,
} from '../src/render/remote.js';
import { UnresolvedMastheadError } from '../src/render/view.js';
import { parseSpec } from '../src/spec/parse.js';
import type { NewsInject } from '../src/spec/types.js';

/**
 * The supplied masthead: a mark the exercise designer owns, replacing the outlet's
 * approximation.
 *
 * The property worth protecting here is not that the feature works, it is that it did not
 * open a network path through the composer. Every case below composes a real document, and
 * none of them may reach the network: a URL either arrives already fetched, as a `data:` URI
 * in the lookup, or it fails.
 */

const BASE: NewsInject = {
  kind: 'news',
  outlet: 'bbc',
  headline: 'Northwind Logistics halts deliveries after an attack on its depots',
  publishedAt: '2026-08-12T08:14:00Z',
};

/** A one pixel PNG, so the embedder has real bytes with a real signature to read. */
const PIXEL_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);

const MARK = 'data:image/svg+xml;base64,PHN2Zy8+';

async function fixtureDir(): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), 'injectlab-masthead-'));
  await writeFile(path.join(dir, 'mark.png'), PIXEL_PNG);
  await writeFile(path.join(dir, 'mark.svg'), '<svg xmlns="http://www.w3.org/2000/svg"/>');
  return dir;
}

describe('a masthead supplied by the spec', () => {
  it('replaces the outlet wordmark with the embedded file', async () => {
    const dir = await fixtureDir();
    const document = await buildDocument(
      { ...BASE, masthead: { path: 'mark.png' } },
      { baseDir: dir },
    );

    expect(document).toContain('class="uk-supplied"');
    expect(document).toContain('src="data:image/png;base64,');
    // The class name is also in the stylesheet, so the attribute form is what proves the
    // element is gone rather than merely restyled.
    expect(document).not.toContain('class="uk-wordmark"');
  });

  it('embeds an SVG mark, which is what most supplied marks are', async () => {
    const dir = await fixtureDir();
    const document = await buildDocument(
      { ...BASE, masthead: { path: 'mark.svg' } },
      { baseDir: dir },
    );

    expect(document).toContain('src="data:image/svg+xml;base64,');
  });

  it('honours a height and leaves the stylesheet to it otherwise', async () => {
    const dir = await fixtureDir();
    const withHeight = await buildDocument(
      { ...BASE, masthead: { path: 'mark.png', height: 52 } },
      { baseDir: dir },
    );
    const without = await buildDocument(
      { ...BASE, masthead: { path: 'mark.png' } },
      { baseDir: dir },
    );

    expect(withHeight).toContain('style="height:52px"');
    expect(without).toContain('style=""');
  });

  it('uses the outlet name as alt text rather than anything the spec chose', async () => {
    const dir = await fixtureDir();
    const document = await buildDocument(
      { ...BASE, masthead: { path: 'mark.png' } },
      { baseDir: dir },
    );

    expect(document).toContain('alt="BBC News"');
  });

  it('works the same way in the other layout family', async () => {
    const dir = await fixtureDir();
    const document = await buildDocument(
      { ...BASE, outlet: 'lemonde', masthead: { path: 'mark.svg' } },
      { baseDir: dir },
    );

    expect(document).toContain('class="fr-supplied"');
    expect(document).not.toContain('class="fr-wordmark"');
  });

  it('leaves the outlet masthead alone when the spec supplies none', async () => {
    const document = await buildDocument(BASE);
    expect(document).toContain('class="uk-wordmark"');
    expect(document).not.toContain('uk-supplied"');
  });
});

describe('composing never fetches', () => {
  /**
   * The invariant, not the feature. `remote.ts` is the only module here that can `fetch`, and
   * keeping it out of the compose graph is what guarantees a composed document is
   * self-contained and that this suite runs with no network. An import added for a shared type
   * would quietly undo that, which is exactly how it would happen.
   */
  it('keeps the fetching module out of the composing graph', async () => {
    const seen = new Set<string>();
    const root = new URL('../src/render/compose.ts', import.meta.url);

    const walk = async (module: URL): Promise<void> => {
      if (seen.has(module.href)) return;
      seen.add(module.href);

      const source = await readFile(module, 'utf8');
      for (const [, specifier] of source.matchAll(/from\s+'(\.[^']+)'/gu)) {
        if (specifier === undefined) continue;
        await walk(new URL(specifier.replace(/\.js$/u, '.ts'), module));
      }
    };

    await walk(root);

    // Without this the test passes for the wrong reason the moment the regex stops matching.
    expect(seen.size).toBeGreaterThan(8);
    expect([...seen].some((href) => href.endsWith('view.ts'))).toBe(true);

    const reached = [...seen].filter((href) => href.endsWith('remote.ts'));
    expect(reached).toEqual([]);
  });

  it('refuses a URL the caller has not already resolved', async () => {
    await expect(
      buildDocument({ ...BASE, masthead: { url: 'https://example.com/mark.svg' } }),
    ).rejects.toThrow(UnresolvedMastheadError);
  });

  it('uses a prefetched URL from the lookup', async () => {
    const document = await buildDocument(
      { ...BASE, masthead: { url: 'https://example.com/mark.svg' } },
      { remoteAssets: new Map([['https://example.com/mark.svg', MARK]]) },
    );

    expect(document).toContain(`src="${MARK}"`);
  });

  it('refuses a URL that is in no lookup even when others are', async () => {
    await expect(
      buildDocument(
        { ...BASE, masthead: { url: 'https://example.com/other.svg' } },
        { remoteAssets: new Map([['https://example.com/mark.svg', MARK]]) },
      ),
    ).rejects.toThrow(UnresolvedMastheadError);
  });
});

const remote = (url: string): NewsInject => ({ ...BASE, masthead: { url } });

describe('prefetching', () => {
  it('collects each URL once however many injects name it', () => {
    const urls = remoteUrlsIn([
      remote('https://example.com/a.svg'),
      remote('https://example.com/a.svg'),
      remote('https://example.com/b.svg'),
      BASE,
    ]);

    expect(urls).toEqual(['https://example.com/a.svg', 'https://example.com/b.svg']);
  });

  it('fetches nothing at all without the opt-in', async () => {
    await expect(prefetchRemoteAssets([remote('https://example.com/a.svg')])).rejects.toThrow(
      RemoteNotPermittedError,
    );
  });

  it('returns an empty lookup for a batch naming nothing remote, without opting in', async () => {
    await expect(prefetchRemoteAssets([BASE])).resolves.toEqual(new Map());
  });

  it('rejects a protocol that is not http or https before opening anything', async () => {
    await expect(fetchRemoteImage('file:///etc/passwd')).rejects.toThrow(RemoteAssetError);
    await expect(fetchRemoteImage('not a url')).rejects.toThrow(RemoteAssetError);
  });
});

/** A minimal valid news spec with the given `masthead:` block appended. */
function spec(masthead: string) {
  return parseSpec(
    [
      'kind: news',
      'outlet: bbc',
      'headline: Northwind Logistics halts deliveries',
      'publishedAt: 2026-08-12T09:14:00+01:00',
      masthead,
    ].join('\n'),
    'yaml',
  );
}

describe('the schema', () => {
  it('accepts a path', () => {
    expect(spec('masthead:\n  path: ./mark.svg').ok).toBe(true);
  });

  it('accepts a URL, which is a separate question from whether it may be fetched', () => {
    expect(spec('masthead:\n  url: https://example.com/mark.svg').ok).toBe(true);
  });

  it('rejects neither, both, and a non-http URL', () => {
    expect(spec('masthead: {}').ok).toBe(false);
    expect(spec('masthead:\n  path: ./m.svg\n  url: https://example.com/m.svg').ok).toBe(false);
    expect(spec('masthead:\n  url: file:///etc/passwd').ok).toBe(false);
  });

  it('keeps the field path in the error, which is the point of not using a union', () => {
    const result = spec('masthead: {}');
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.some((error) => error.path?.includes('masthead'))).toBe(true);
  });
});
