import { chars } from 'charcheck';
import { describe, expect, it } from 'vitest';

import {
  CharPolicyError,
  formatCharFindings,
  gate,
  scanInject,
  userText,
} from '../src/text/chars.js';
import type { NewsInject } from '../src/spec/types.js';

/** Banned characters are referenced by name, never typed literally, for the obvious reason. */
const EM_DASH = chars.EM_DASH;
const ZERO_WIDTH_SPACE = chars.ZERO_WIDTH_SPACE;

function inject(overrides: Partial<NewsInject> = {}): NewsInject {
  return {
    kind: 'news',
    outlet: 'bbc',
    headline: 'Northgate Utilities says billing systems offline',
    publishedAt: '2026-08-12T09:14:00+01:00',
    ...overrides,
  };
}

describe('userText', () => {
  it('collects every user-authored string with a path a person can act on', () => {
    const fields = userText(
      inject({
        standfirst: 'A standfirst',
        byline: 'Helen Morrow',
        section: 'Business',
        body: ['One', 'Two'],
        image: { path: 'photo.jpg', caption: 'A caption', credit: 'A credit' },
      }),
      { disclaimer: 'Exercise material' },
    );

    expect([...fields.keys()]).toEqual([
      'headline',
      'standfirst',
      'byline',
      'section',
      'body.0',
      'body.1',
      'image.caption',
      'image.credit',
      'disclaimer',
    ]);
  });

  it('skips absent and empty fields rather than scanning nothing repeatedly', () => {
    expect([...userText(inject()).keys()]).toEqual(['headline']);
  });
});

describe('gate', () => {
  it('rejects an em dash in the headline under the default error policy', async () => {
    const spec = inject({ headline: `Billing offline ${EM_DASH} regulator notified` });
    await expect(gate(spec, 'error')).rejects.toBeInstanceOf(CharPolicyError);
  });

  it('names the field and offers a replacement for the whole string', async () => {
    const spec = inject({ headline: `Billing offline ${EM_DASH} regulator notified` });
    const findings = await scanInject(spec);

    expect(findings).toHaveLength(1);
    expect(findings[0]?.field).toBe('headline');
    // The whitespace around the dash is part of the match, so the suggestion comes back
    // punctuated rather than with a double space where the dash used to be.
    expect(findings[0]?.suggestion).toBe('Billing offline: regulator notified');
  });

  it('reports without throwing under warn', async () => {
    const spec = inject({ headline: `Billing offline ${EM_DASH} regulator notified` });
    const result = await gate(spec, 'warn');
    expect(result.findings).toHaveLength(1);
  });

  it('does not scan at all under off', async () => {
    const spec = inject({ headline: `Billing offline ${EM_DASH} regulator notified` });
    const result = await gate(spec, 'off');
    expect(result.findings).toEqual([]);
  });

  it('catches a zero width space, which is the one nobody sees in review', async () => {
    const spec = inject({ headline: `Billing${ZERO_WIDTH_SPACE} offline` });
    const findings = await scanInject(spec);

    expect(findings).toHaveLength(1);
    expect(findings[0]?.ruleId).toBe('no-invisibles');
    expect(findings[0]?.suggestion).toBe('Billing offline');
  });

  it('scans the disclaimer, since it is user text that reaches the page', async () => {
    const findings = await scanInject(inject(), { disclaimer: `Exercise ${EM_DASH} not real` });
    expect(findings[0]?.field).toBe('disclaimer');
  });

  it('reports the deepest body paragraph by index', async () => {
    const spec = inject({ body: ['Clean paragraph.', `Second ${EM_DASH} paragraph.`] });
    const findings = await scanInject(spec);
    expect(findings[0]?.field).toBe('body.1');
  });

  it('leaves a clean French headline with accents and guillemets untouched', async () => {
    const spec = inject({
      headline: 'Le regulateur confirme avoir ete notifie par l’operateur',
      standfirst: '« Nous avons isole les systemes concernes », indique la direction.',
      body: ['La panne touche pres de 300 000 abonnes, a Paris et en Ile-de-France.'],
    });

    expect(await scanInject(spec)).toEqual([]);
  });

  it('passes an inject through the error policy when it is clean', async () => {
    await expect(gate(inject(), 'error')).resolves.toEqual({ findings: [] });
  });
});

describe('formatCharFindings', () => {
  it('prints the field, the column and the suggestion', async () => {
    const findings = await scanInject(inject({ headline: `A ${EM_DASH} b` }));
    const lines = formatCharFindings(findings);

    // Column 2, not 3: the match starts at the space before the dash.
    expect(lines[0]).toMatch(/^headline:2: /u);
    expect(lines[0]).toMatch(/Suggested: A: b$/u);
  });
});
