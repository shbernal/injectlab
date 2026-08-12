import { describe, expect, it } from 'vitest';

import { getOutlet } from '../src/outlets/registry.js';
import type { Outlet } from '../src/outlets/types.js';
import { formatByline, formatDate, formatTime, formatTimestamp } from '../src/text/locale.js';

/** A fixed instant. 09:14 in London, 10:14 in Paris, on the same day. */
const INSTANT = '2026-08-12T08:14:00Z';

const bbc = getOutlet('bbc');

/**
 * Le Monde is authored later. Locale formatting takes an `Outlet` and never reads the
 * registry, so the French conventions are testable now with a fixture built here.
 */
const frenchDaily: Outlet = {
  ...bbc,
  id: 'fixture-fr',
  name: 'A French daily',
  country: 'fr',
  locale: 'fr-FR',
  timeZone: 'Europe/Paris',
  layout: 'fr-online-daily',
  domain: 'example.fr',
  conventions: {
    dateFormat: 'fr-long',
    bylinePrefix: 'Par ',
    sectionDefault: 'Economie',
    headlineCase: 'sentence',
    updatedLabel: 'Publié le',
  },
};

/** The other French convention: the same locale, writing the date in figures. */
const frenchFreesheet: Outlet = {
  ...frenchDaily,
  conventions: { ...frenchDaily.conventions, dateFormat: 'fr-numeric', bylinePrefix: '' },
};

describe('formatDate', () => {
  it('writes a UK long date in the outlet time zone', () => {
    expect(formatDate(INSTANT, bbc)).toBe('12 August 2026');
  });

  it('writes a French long date in the outlet time zone', () => {
    expect(formatDate(INSTANT, frenchDaily)).toMatch(/^12 ao.t 2026$/u);
  });

  it('writes a French numeric date in the outlet order, day first', () => {
    expect(formatDate(INSTANT, frenchFreesheet)).toBe('12/08/2026');
  });

  it('writes an ISO date when the convention asks for one', () => {
    expect(
      formatDate(INSTANT, { ...bbc, conventions: { ...bbc.conventions, dateFormat: 'iso' } }),
    ).toBe('2026-08-12');
  });

  it('rolls the date back when the instant is the previous day in the outlet zone', () => {
    // 00:30 UTC on the 13th is 20:30 on the 12th in New York.
    const newYork: Outlet = { ...bbc, locale: 'en-US', timeZone: 'America/New_York' };
    expect(formatDate('2026-08-13T00:30:00Z', newYork)).toBe('August 12, 2026');
  });
});

describe('formatTime', () => {
  it('reads the outlet zone, not the host zone', () => {
    expect(formatTime(INSTANT, bbc)).toBe('09:14');
    expect(formatTime(INSTANT, frenchDaily)).toBe('10:14');
  });
});

describe('formatTimestamp', () => {
  it('joins the UK convention with a comma', () => {
    expect(formatTimestamp(INSTANT, bbc)).toBe('Published 12 August 2026, 09:14');
  });

  it('joins the French convention with the hour marker', () => {
    expect(formatTimestamp(INSTANT, frenchDaily)).toMatch(/^Publié le 12 ao.t 2026 à 10h14$/u);
  });

  it('keeps the hour marker when the date is numeric, since only the date changes', () => {
    expect(formatTimestamp(INSTANT, frenchFreesheet)).toBe('Publié le 12/08/2026 à 10h14');
  });
});

describe('formatByline', () => {
  it('applies the outlet prefix', () => {
    expect(formatByline('Helen Morrow', bbc)).toBe('By Helen Morrow');
    expect(formatByline('Jean Dupont', frenchDaily)).toBe('Par Jean Dupont');
  });

  it('prints the name alone for an outlet whose prefix is empty', () => {
    expect(formatByline('Jean Dupont', frenchFreesheet)).toBe('Jean Dupont');
  });

  it('returns nothing for an absent or blank byline, rather than a bare prefix', () => {
    expect(formatByline(undefined, bbc)).toBe('');
    expect(formatByline('   ', bbc)).toBe('');
  });
});
