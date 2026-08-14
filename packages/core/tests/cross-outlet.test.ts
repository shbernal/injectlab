import { describe, expect, it } from 'vitest';

import { getOutlet, listOutlets } from '../src/outlets/registry.js';
import { buildDocument } from '../src/render/compose.js';
import type { NewsInject, OutletId } from '../src/index.js';

/**
 * The same logical story, told by two outlets.
 *
 * This is the assertion that the theming abstraction is real rather than asserted. If the two
 * documents came out the same in the ways that identify a publication, the outlet record
 * would be decoration.
 */

function story(outlet: OutletId): NewsInject {
  return {
    kind: 'news',
    outlet,
    headline: 'A logistics company has been hit by ransomware',
    standfirst: 'The company says it has taken systems offline.',
    byline: 'A Reporter',
    publishedAt: '2026-08-12T08:14:00Z',
    body: ['The company has taken its systems offline.'],
  };
}

const bbc = await buildDocument(story('bbc'));
const lemonde = await buildDocument(story('lemonde'));
const freesheet = await buildDocument(story('20minutes'));

describe('two outlets, one story', () => {
  it('differ in masthead', () => {
    expect(bbc).toContain('BBC NEWS');
    expect(lemonde).toContain('Le Monde');
    expect(bbc).not.toContain('Le Monde');
    expect(lemonde).not.toContain('BBC NEWS');
  });

  it('differ in font stack', () => {
    expect(bbc).toContain("'BBC Reith Serif Stand-in'");
    expect(lemonde).toContain("'Le Monde Serif Stand-in'");
    expect(bbc).not.toContain('Le Monde Serif Stand-in');
  });

  it('differ in the date string, because the conventions differ', () => {
    // 08:14 UTC is 09:14 in London and 10:14 in Paris, and the two write it differently.
    expect(bbc).toContain('Published 12 August 2026, 09:14');
    expect(lemonde).toMatch(/Publié le 12 ao.t 2026 à 10h14/u);
    // Two French outlets in one time zone, writing the same instant two ways.
    expect(freesheet).toContain('Publié le 12/08/2026 à 10h14');
  });

  it('differ in byline convention', () => {
    expect(bbc).toContain('By A Reporter');
    expect(lemonde).toContain('Par A Reporter');
    // A freesheet signs the name bare, which is a convention and not a missing prefix.
    expect(freesheet).toContain('A Reporter');
    expect(freesheet).not.toContain('Par A Reporter');
  });

  it('differ in layout family, not merely in colour', () => {
    expect(bbc).toContain('uk-masthead');
    expect(lemonde).toContain('fr-masthead');
    expect(bbc).not.toContain('fr-shell');
    expect(lemonde).not.toContain('uk-shell');
  });

  /**
   * The two French outlets are the sharper test than the two countries: same language, same
   * time zone, same country, and nothing shared below the disclaimer band.
   */
  it('separate the two French outlets by arrangement, not by copy', () => {
    expect(freesheet).toContain('fs-band');
    expect(freesheet).not.toContain('fr-shell');
    expect(lemonde).not.toContain('fs-band');
  });

  it('differ in document language', () => {
    expect(bbc).toContain('lang="en-GB"');
    expect(lemonde).toContain('lang="fr-FR"');
  });

  /** The framing is the one thing that must not vary by outlet, in wording or in style. */
  it('share the disclaimer band, character for character', () => {
    const band = /<div class="il-exercise (il-exercise--\w+ il-exercise--top)">([^<]*)<\/div>/u;
    for (const document of [bbc, lemonde, freesheet]) {
      expect(band.exec(document)?.[1]).toBe('il-exercise--bold il-exercise--top');
      expect(band.exec(document)?.[2]).toBe('[EXERCISE, EXERCISE, EXERCISE]');
    }
  });
});

describe('the second outlet cost nothing in the first', () => {
  /**
   * The acceptance test for the whole architecture: adding Le Monde must not have required
   * editing the UK layout. Nothing in a layout may name an outlet.
   */
  it('has no outlet name anywhere in a layout', async () => {
    const layouts = await Promise.all(
      ['uk-online-broadsheet', 'fr-online-daily', 'fr-online-freesheet'].map(async (family) => {
        const { readFile } = await import('node:fs/promises');
        return readFile(new URL(`../src/render/layouts/${family}.ts`, import.meta.url), 'utf8');
      }),
    );

    for (const source of layouts) {
      // Comments explain why the layout looks the way it does and may cite a real page. The
      // rule is about what the layout branches on, so this checks the code, not the prose.
      const code = source.replaceAll(/\/\*[\s\S]*?\*\/|\/\/.*/gu, '');
      for (const outlet of listOutlets()) {
        expect(code, `${outlet.id} named in a layout`).not.toContain(outlet.name);
        expect(code).not.toContain(`'${outlet.id}'`);

        // A section name is a brand too, and it is the one that got through: the French daily
        // layout carried Le Monde's row, Pixels included, until Les Echos rendered through it.
        for (const section of outlet.conventions.navSections) {
          expect(code, `${outlet.id} section ${section} written into a layout`).not.toContain(
            `>${section}<`,
          );
        }
      }
    }
  });

  it('renders every registered outlet without a layout that knows about it', async () => {
    for (const outlet of listOutlets()) {
      const document = await buildDocument(story(outlet.id as OutletId));
      expect(document, outlet.id).toContain(getOutlet(outlet.id as OutletId).theme.masthead.source);
    }
  });
});
