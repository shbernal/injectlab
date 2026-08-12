import type { Outlet } from './types.js';

/**
 * BBC News.
 *
 * Measured, not guessed. The typography and colours come from `getComputedStyle` on a real
 * article at a 1280 viewport: headline 38px at weight 500 with a 44px line, body column
 * 721px inside a 1248px container, text `#202224`, timestamps `#545658`.
 *
 * Weight 500 matters and is not a rounding of 400. Every bundled face is variable across
 * 400 to 700 in one file, so 500 is a real interpolated weight rather than a synthesised
 * approximation, and a headline set at 700 reads noticeably heavier than the real thing.
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
        family: 'BBC Reith Serif Stand-in',
        face: 'lora',
        fallback: 'Georgia, "Times New Roman", serif',
        weights: [400, 500, 700],
      },
      body: {
        family: 'BBC Reith Serif Stand-in',
        face: 'lora',
        fallback: 'Georgia, "Times New Roman", serif',
        weights: [400, 500, 700],
      },
      ui: {
        family: 'BBC Reith Sans Stand-in',
        face: 'libre-franklin',
        fallback: 'Arial, Helvetica, sans-serif',
        weights: [400, 500, 700],
      },
    },
    colors: {
      text: '#202224',
      muted: '#545658',
      accent: '#bb1919',
      // The red is dark enough to carry white, which is how the BBC uses it.
      onAccent: '#ffffff',
      rule: '#e6e8ea',
      background: '#ffffff',
      sectionTag: '#bb1919',
    },
    scale: {
      headlineSize: 38,
      headlineWeight: 500,
      // 44px over 38px, as measured.
      headlineLeading: 1.16,
      measure: 721,
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
    'Typography is approximated: Lora stands in for BBC Reith Serif and Libre Franklin for BBC ' +
    'Reith Sans, both open-licensed and chosen for visual proximity rather than identity. No BBC ' +
    'font file is used. The masthead is a plain wordmark set in the stand-in sans, not the BBC ' +
    'blocks logo, which is a trademark and is not reproduced. Colours, sizes and column widths ' +
    'were measured from a real article and are close; the letterforms are not the same ' +
    'letterforms and will not survive a careful look.',
};
