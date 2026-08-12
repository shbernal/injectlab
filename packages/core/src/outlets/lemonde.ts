import type { Outlet } from './types.js';

/**
 * Le Monde.
 *
 * Partly measured. Text colour `#2a303c`, muted `#666e80` and the palette below were read
 * from a real capture, `#ffd644` being the signature yellow that dominates the page and
 * marks subscriber content. The masthead is a wordmark, which is what Le Monde's actually
 * is: the recognisable part is the letterforms, not a device.
 *
 * The article-level metrics are not measured, and that is worth knowing before trusting
 * them. Le Monde's article pages sit behind a bot challenge that the capture tool hit and
 * reported rather than silently recording: it returned a "Client Challenge" page with no
 * headline at all. The section front loaded and gave the families and the palette; the
 * headline size and column width below are judged, not read. A future capture from a
 * session that gets through should replace them.
 *
 * Real families are Marr Sans and The Antiqua B, neither of which is bundled or could be.
 */
export const lemonde: Outlet = {
  id: 'lemonde',
  name: 'Le Monde',
  country: 'fr',
  locale: 'fr-FR',
  timeZone: 'Europe/Paris',
  layout: 'fr-online-daily',
  domain: 'lemonde.fr',
  theme: {
    fonts: {
      headline: {
        family: 'Le Monde Serif Stand-in',
        face: 'source-serif-4',
        fallback: 'Georgia, "Times New Roman", serif',
        weights: [400, 600, 700],
      },
      body: {
        family: 'Le Monde Serif Stand-in',
        face: 'source-serif-4',
        fallback: 'Georgia, "Times New Roman", serif',
        weights: [400, 600, 700],
      },
      ui: {
        family: 'Le Monde Sans Stand-in',
        face: 'inter',
        fallback: 'Roboto, Arial, sans-serif',
        weights: [400, 500, 700],
      },
    },
    colors: {
      text: '#2a303c',
      muted: '#666e80',
      // The signature yellow. It fills the subscriber marker rather than colouring text.
      accent: '#ffd644',
      rule: '#d5d8dc',
      background: '#ffffff',
      // The measured link blue, which is readable as a kicker where the yellow would not be.
      sectionTag: '#026b9c',
    },
    scale: {
      headlineSize: 40,
      headlineWeight: 700,
      headlineLeading: 1.15,
      measure: 700,
    },
    masthead: { kind: 'wordmark', source: 'Le Monde' },
  },
  conventions: {
    dateFormat: 'fr-long',
    bylinePrefix: 'Par ',
    sectionDefault: 'International',
    headlineCase: 'sentence',
    updatedLabel: 'Publié le',
  },
  fidelity:
    'Typography is approximated: Source Serif 4 stands in for The Antiqua B and Inter for Marr ' +
    'Sans, both open-licensed and chosen for visual proximity rather than identity. No Le Monde ' +
    'font file is used and the masthead is set in the stand-in serif rather than reproduced. ' +
    'Colours are measured from a real page, including the signature yellow. The headline size ' +
    'and column width are judged rather than measured, because the article pages sit behind a ' +
    'bot challenge the capture tool could not pass, so the proportions are the least reliable ' +
    'part of this record.',
};
