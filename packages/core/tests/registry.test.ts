import { describe, expect, it } from 'vitest';

import { getOutlet, isOutletId, listOutletIds, listOutlets } from '../src/outlets/registry.js';
import type { Outlet } from '../src/outlets/types.js';

const HEX = /^#[0-9a-f]{6}$/u;
const LAYOUT_FAMILIES = new Set([
  'uk-online-broadsheet',
  'fr-online-daily',
  'fr-online-freesheet',
  'fr-online-magazine',
]);

describe('the outlet registry', () => {
  it('answers getOutlet for every id it lists', () => {
    for (const id of listOutletIds()) {
      expect(getOutlet(id).id).toBe(id);
    }
  });

  it('narrows known ids and rejects unknown ones', () => {
    expect(isOutletId('bbc')).toBe(true);
    expect(isOutletId('lefigaro')).toBe(false);
    expect(isOutletId('constructor')).toBe(false);
  });

  /**
   * One loop over the registry is worth more than a test per outlet: it fails the moment
   * someone adds a half-authored outlet, which is the failure that actually happens.
   */
  describe.each(listOutlets().map((outlet) => [outlet.id, outlet] as const))(
    'outlet %s',
    (_id, outlet: Outlet) => {
      it('names itself and its domain', () => {
        expect(outlet.name.trim()).not.toBe('');
        expect(outlet.domain.trim()).not.toBe('');
        expect(outlet.domain).not.toMatch(/^https?:/u);
      });

      it('declares a layout family that exists', () => {
        expect(LAYOUT_FAMILIES.has(outlet.layout)).toBe(true);
      });

      it('carries a locale and an IANA time zone that Intl accepts', () => {
        expect(() =>
          new Intl.DateTimeFormat(outlet.locale, { timeZone: outlet.timeZone }).format(new Date(0)),
        ).not.toThrow();
      });

      it('uses six-digit lowercase hex for every colour', () => {
        for (const [name, value] of Object.entries(outlet.theme.colors)) {
          expect(value, `colors.${name}`).toMatch(HEX);
        }
      });

      it('asks for a headline weight its headline face actually carries', () => {
        const { headline } = outlet.theme.fonts;
        expect(headline.weights).toContain(outlet.theme.scale.headlineWeight);
      });

      it('names a bundled face and a fallback stack for every role', () => {
        for (const [role, font] of Object.entries(outlet.theme.fonts)) {
          expect(font.face, `fonts.${role}.face`).toMatch(/^[a-z0-9-]+$/u);
          expect(font.family.trim(), `fonts.${role}.family`).not.toBe('');
          expect(font.fallback.trim(), `fonts.${role}.fallback`).not.toBe('');
          expect(font.weights.length, `fonts.${role}.weights`).toBeGreaterThan(0);
        }
      });

      it('has a masthead with content', () => {
        expect(outlet.theme.masthead.source.trim()).not.toBe('');
      });

      /**
       * The fidelity note is the honest answer to "is that the real masthead". It has to be
       * written, not defaulted, so this asserts it says something rather than that it exists.
       */
      it('says what it approximates, at length', () => {
        expect(outlet.fidelity.length).toBeGreaterThan(60);
      });

      it('has a sane body measure and headline scale', () => {
        expect(outlet.theme.scale.measure).toBeGreaterThan(300);
        expect(outlet.theme.scale.headlineSize).toBeGreaterThan(16);
        expect(outlet.theme.scale.headlineLeading).toBeGreaterThan(0.8);
        expect(outlet.theme.scale.headlineLeading).toBeLessThan(2);
      });

      it('defaults a section and labels its timestamp', () => {
        expect(outlet.conventions.sectionDefault.trim()).not.toBe('');
        expect(outlet.conventions.updatedLabel.trim()).not.toBe('');
      });
    },
  );
});
