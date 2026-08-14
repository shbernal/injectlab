import type { Outlet } from './types.js';

/**
 * Le Monde.
 *
 * Measured, at last. Le Monde answers an automated visit with a bot challenge, so the first
 * pass at this file had a measured palette from the section front and a judged headline size
 * and column width, both of which were wrong. The numbers below come from a real article
 * page a human saved out of a browser and the capture tool measured offline, with
 * `--from-saved`: the saved markup served as the document at its own URL, so the real
 * stylesheets and the real fonts still resolved and `getComputedStyle` answered for a 1280
 * viewport exactly as it would have live.
 *
 * Two corrections worth naming, because both were judged badly. The headline is 38px at
 * weight 500 over a 42px line, not 40px at 700 over 46px: a third lighter than the guess and
 * noticeably so at a glance. The body column is 556px, not 700px, which was the single
 * largest error in the file, since column width sets how a headline breaks and therefore how
 * the whole block reads.
 *
 * The saved article is an "Analyse", which carries `--opinion` modifiers that set the title
 * to weight 800 over a 1.26 line inside a 680px float. Those are recorded in the reference
 * notes and are not what is used here. Stripping the modifiers and re-measuring gave the
 * plain news-article variant above, which is what an inject should look like.
 *
 * `measure` is the logged-out column. A signed-in subscriber gets 664px, since `.main--abo`
 * widens `.article__content` from 55.6rem to 66.4rem.
 *
 * From the section front and unchanged: `#ffd644`, the signature yellow that marks
 * subscriber content. It appears nowhere on the article page itself. The masthead is a
 * wordmark, which is what Le Monde's actually is: the recognisable part is the letterforms,
 * not a device.
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
        // 500 because the headline is set at 500. Source Serif 4 is variable across 400 to
        // 700 in one file, so this is a real interpolated weight, not a synthesised one.
        weights: [400, 500, 600, 700],
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
      // The headline and the chapeau. Body copy is a shade lighter at `#383f4e`, which the
      // theme has no field for and the layout does not distinguish.
      text: '#2a303b',
      // The dateline, `.meta__date`.
      muted: '#717b8e',
      // The signature yellow. It fills the subscriber marker rather than colouring text.
      accent: '#ffd644',
      // The marker's own text. The yellow is far too light to carry white, so it carries the
      // headline colour, which is what Le Monde does.
      onAccent: '#2a303b',
      // The article's dominant 1px border, on ten separate elements.
      rule: '#d5d8dc',
      // The article sits on white, inside a page whose surround is `#f5f6f8`.
      background: '#ffffff',
      // The breadcrumb, which is where the layout's kicker sits and is set the same way:
      // condensed sans, uppercase, letterspaced. The earlier value was a link blue off the
      // section front and appears nowhere above an article headline.
      sectionTag: '#6e7787',
    },
    scale: {
      headlineSize: 38,
      headlineWeight: 500,
      // 42.18px over 38px, as measured.
      headlineLeading: 1.11,
      measure: 556,
    },
    // One column the whole way down, which is the French daily at its plainest: the headline
    // runs to the same 556px as the body and starts at the same left edge.
    hero: { measure: 556, align: 'left' },
    masthead: { kind: 'wordmark', source: 'Le Monde' },
  },
  conventions: {
    // Pixels is the tech section, and it is Le Monde's own word for it.
    navSections: ['International', 'Politique', 'Economie', 'Pixels'],
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
    'Colours, sizes and the column width were measured from a real article page, which had to ' +
    'be saved from a browser by hand and measured offline because Le Monde answers an ' +
    'automated visit with a bot challenge. The proportions are therefore as sound as the ' +
    'palette, which was not true of this record before. What remains approximate is the ' +
    'lettering and the arrangement: the chapeau is set in the stand-in serif where Le Monde ' +
    'sets it in its sans, and the letterforms are not the same letterforms and will not ' +
    'survive a careful look.',
};
