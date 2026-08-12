import { readFile, stat } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';

import {
  getTypeface,
  isTypefaceId,
  listTypefaces,
  typefaceFileUrl,
  typefaceLicenceUrl,
} from '../src/fonts/catalogue.js';
import { listOutlets } from '../src/outlets/registry.js';

/** WOFF2 files begin with the ASCII tag `wOF2`. */
const WOFF2_SIGNATURE = 'wOF2';

describe('the font catalogue', () => {
  it('narrows known ids and rejects unknown ones', () => {
    expect(isTypefaceId('lora')).toBe(true);
    expect(isTypefaceId('helvetica')).toBe(false);
  });

  describe.each(listTypefaces().map((face) => [face.id, face] as const))('%s', (_id, face) => {
    it('ships a real WOFF2 file at the path it declares', async () => {
      const bytes = await readFile(typefaceFileUrl(face));
      expect(bytes.subarray(0, 4).toString('latin1')).toBe(WOFF2_SIGNATURE);
      expect(bytes.length).toBeGreaterThan(1000);
    });

    /**
     * A font file with no licence beside it is the one thing in this directory that must
     * never exist, so this asserts the text is there and names the licence.
     */
    it('ships its licence, naming the SIL Open Font License', async () => {
      const text = await readFile(typefaceLicenceUrl(face), 'utf8');
      expect(text).toContain('SIL OPEN FONT LICENSE');
      expect(text).toContain(face.licence.copyright.split(' (')[0] ?? '');
    });

    it('declares a weight range wide enough to be worth having', () => {
      expect(face.weights.min).toBeLessThan(face.weights.max);
      expect(face.weights.min).toBeGreaterThanOrEqual(100);
      expect(face.weights.max).toBeLessThanOrEqual(1000);
    });

    it('says what it stands in for, so an outlet author can choose between faces', () => {
      expect(face.standsInFor.length).toBeGreaterThan(30);
    });
  });
});

describe('outlet themes against the catalogue', () => {
  it('name a bundled face that exists, at weights inside its variable range', async () => {
    for (const outlet of listOutlets()) {
      for (const [role, font] of Object.entries(outlet.theme.fonts)) {
        const where = `${outlet.id}.fonts.${role}`;
        const face = getTypeface(font.face);

        await expect(stat(typefaceFileUrl(face)), where).resolves.toBeDefined();

        for (const weight of font.weights) {
          expect(weight, `${where} weight ${weight}`).toBeGreaterThanOrEqual(face.weights.min);
          expect(weight, `${where} weight ${weight}`).toBeLessThanOrEqual(face.weights.max);
        }
      }
    }
  });
});
