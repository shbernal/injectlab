import type { Outlet } from './types.js';

/**
 * BBC News.
 *
 * Provisional. The values here were read off the render spike rather than off a captured
 * article, so they are a plausible UK online broadsheet rather than a studied match. They
 * exist now because the registry has to hold at least one outlet for `OutletId` to be a
 * usable type, and because a theme is much easier to refine than to invent. The capture and
 * authoring pass replaces these numbers with measured ones.
 */
export const bbc: Outlet = {
  id: 'bbc',
  name: 'BBC News',
  country: 'uk',
  locale: 'en-GB',
  timeZone: 'Europe/London',
  layout: 'uk-online-broadsheet',
  domain: 'bbc.co.uk/news',
  theme: {
    fonts: {
      headline: {
        family: 'IL Serif',
        face: 'lora',
        fallback: 'Georgia, "Times New Roman", serif',
        weights: [400, 700],
      },
      body: {
        family: 'IL Serif',
        face: 'lora',
        fallback: 'Georgia, "Times New Roman", serif',
        weights: [400, 700],
      },
      ui: {
        family: 'IL Sans',
        face: 'libre-franklin',
        fallback: 'Arial, Helvetica, sans-serif',
        weights: [400, 700],
      },
    },
    colors: {
      text: '#141414',
      muted: '#6e6e6e',
      accent: '#bb1919',
      rule: '#ebebeb',
      background: '#ffffff',
      sectionTag: '#bb1919',
    },
    scale: {
      headlineSize: 46,
      headlineWeight: 700,
      headlineLeading: 1.1,
      measure: 780,
    },
    masthead: { kind: 'wordmark', source: 'BBC NEWS' },
  },
  conventions: {
    dateFormat: 'uk-long',
    bylinePrefix: 'By ',
    sectionDefault: 'UK',
    headlineCase: 'sentence',
    updatedLabel: 'Published',
  },
  fidelity:
    'Typography is approximated: Lora stands in for Reith Serif and Libre Franklin for Reith Sans, ' +
    'both open-licensed and chosen for proximity rather than identity. The masthead is set as a ' +
    'plain wordmark, not the BBC blocks logo. No BBC font or logo file is used. Colours and metrics ' +
    'are provisional and have not yet been measured against a captured article.',
};
