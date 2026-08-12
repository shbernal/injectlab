import { describe, expect, it } from 'vitest';

import { formatForPath, formatSpecErrors, parseSpec } from '../src/spec/parse.js';

const VALID_YAML = `
kind: news
outlet: bbc
headline: Northgate Utilities says billing systems offline after cyber attack
standfirst: The company has told customers not to attempt payments.
byline: Helen Morrow
publishedAt: 2026-08-12T09:14:00+01:00
body:
  - Northgate Utilities has taken its customer billing platform offline.
  - The regulator confirmed it had been notified.
`;

/** Returns the errors, failing the test if the parse unexpectedly succeeded. */
function errorsOf(text: string, format: 'yaml' | 'json' = 'yaml') {
  const result = parseSpec(text, format);
  if (result.ok) throw new Error('expected the parse to fail, but it succeeded');
  return result.errors;
}

describe('parseSpec', () => {
  it('reads a single YAML inject into a one-element list', () => {
    const result = parseSpec(VALID_YAML, 'yaml');
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.injects).toHaveLength(1);
    const inject = result.injects[0];
    expect(inject?.kind).toBe('news');
    expect(inject?.outlet).toBe('bbc');
    expect(inject?.byline).toBe('Helen Morrow');
    expect(inject?.body).toHaveLength(2);
  });

  it('reads the same document as JSON', () => {
    const json = JSON.stringify({
      kind: 'news',
      outlet: 'bbc',
      headline: 'Billing systems offline',
      publishedAt: '2026-08-12T09:14:00+01:00',
    });

    const result = parseSpec(json, 'json');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.injects[0]?.headline).toBe('Billing systems offline');
  });

  it('normalises a top-level injects list to the same shape as a single inject', () => {
    const text = `
injects:
  - kind: news
    outlet: bbc
    headline: First
    publishedAt: 2026-08-12T09:14:00+01:00
  - kind: news
    outlet: bbc
    headline: Second
    publishedAt: 2026-08-12T11:00:00+01:00
`;

    const result = parseSpec(text, 'yaml');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.injects.map((inject) => inject.headline)).toEqual(['First', 'Second']);
  });

  it('drops keys that were absent rather than materialising them as undefined', () => {
    const result = parseSpec(
      'kind: news\noutlet: bbc\nheadline: Bare\npublishedAt: 2026-08-12T09:14:00Z\n',
      'yaml',
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(Object.hasOwn(result.injects[0] ?? {}, 'standfirst')).toBe(false);
  });

  describe('malformed input', () => {
    it('reports unparseable YAML at the document root', () => {
      const errors = errorsOf('kind: news\n  outlet: [unclosed\n');
      expect(errors[0]?.path).toBe('');
      expect(errors[0]?.message).toMatch(/not valid YAML/u);
    });

    it('reports unparseable JSON at the document root', () => {
      const errors = errorsOf('{ "kind": "news", ', 'json');
      expect(errors[0]?.path).toBe('');
      expect(errors[0]?.message).toMatch(/not valid JSON/u);
    });

    it('names the field when a headline is the wrong type', () => {
      const errors = errorsOf(
        'kind: news\noutlet: bbc\nheadline: 3\npublishedAt: 2026-08-12T09:14:00Z\n',
      );
      const headline = errors.find((error) => error.path === 'headline');
      expect(headline).toBeDefined();
      expect(headline?.received).toBe('3');
    });

    it('lists the known outlets when the outlet is unknown', () => {
      const errors = errorsOf(
        'kind: news\noutlet: lefigaro\nheadline: Ok\npublishedAt: 2026-08-12T09:14:00Z\n',
      );
      const outlet = errors.find((error) => error.path === 'outlet');
      expect(outlet?.message).toMatch(/unknown outlet/u);
      expect(outlet?.message).toMatch(/bbc/u);
    });

    it('rejects a timestamp with no offset, since it would be read against the host zone', () => {
      const errors = errorsOf(
        'kind: news\noutlet: bbc\nheadline: Ok\npublishedAt: 2026-08-12T09:14:00\n',
      );
      const at = errors.find((error) => error.path === 'publishedAt');
      expect(at?.message).toMatch(/offset/u);
    });

    it('rejects an empty headline rather than rendering a blank page', () => {
      const errors = errorsOf(
        "kind: news\noutlet: bbc\nheadline: '   '\npublishedAt: 2026-08-12T09:14:00Z\n",
      );
      expect(errors.find((error) => error.path === 'headline')?.message).toMatch(/empty/u);
    });

    it('reports a path into the list when one inject in a batch is bad', () => {
      const errors = errorsOf(`
injects:
  - kind: news
    outlet: bbc
    headline: Fine
    publishedAt: 2026-08-12T09:14:00Z
  - kind: news
    outlet: bbc
    publishedAt: 2026-08-12T09:14:00Z
`);
      expect(errors.some((error) => error.path.startsWith('injects.1'))).toBe(true);
    });
  });

  it('formats errors as file, path and message', () => {
    const errors = errorsOf(
      'kind: news\noutlet: bbc\nheadline: 3\npublishedAt: 2026-08-12T09:14:00Z\n',
    );
    const lines = formatSpecErrors('demos/acme.yaml', errors);
    expect(lines[0]).toMatch(/^demos\/acme\.yaml: headline: /u);
  });
});

describe('formatForPath', () => {
  it('treats .json as JSON and everything else as YAML', () => {
    expect(formatForPath('demos/a.json')).toBe('json');
    expect(formatForPath('demos/a.JSON')).toBe('json');
    expect(formatForPath('demos/a.yaml')).toBe('yaml');
    expect(formatForPath('demos/a.yml')).toBe('yaml');
  });
});
