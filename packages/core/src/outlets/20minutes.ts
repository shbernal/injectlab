import type { Outlet } from './types.js';

/**
 * 20 Minutes.
 *
 * Measured from three live articles at a 1280 viewport, in `societe`, `monde` and
 * `consommation`. Unlike Le Monde, 20 Minutes answers an automated visit with the article, so
 * these are live captures rather than a page saved by hand. The three agreed on every number
 * below, which is the point of capturing more than one: a single article can be an atypical
 * template, and three that agree are the template.
 *
 * The headline is 48px at weight 700 over a 57.6px line, across a 1024px content width, with
 * the body column only 592px of it and inset under a 672px figure. That gap between headline
 * measure and body measure is the freesheet's whole look, and it is why this outlet does not
 * sit in the French daily family: there the headline and the body share one centred column.
 *
 * The face is the surprise. 20 Minutes sets its headlines and its body in Source Serif Pro,
 * which is open-licensed, and the bundled catalogue carries Source Serif 4, its successor.
 * So this record names the real design rather than a stand-in for it, which is true of no
 * other outlet here and is stated as such in `fidelity` rather than quietly enjoyed. The
 * interface sans is a different matter: the site's own stack resolves to Arial, and Inter
 * stands in for it.
 *
 * `#4742ff` is the signature ultramarine, and it is not an accent in the sense the other two
 * outlets use the word. It fills the masthead band, the breadcrumb pills and the rule under
 * the section bar, so it is a surface far more often than it is a highlight. `#fffffe` is the
 * measured page background, off white by one unit in blue, and reproduced rather than rounded
 * because the whole file is measurements.
 */
export const twentyMinutes: Outlet = {
  id: '20minutes',
  name: '20 Minutes',
  country: 'fr',
  locale: 'fr-FR',
  timeZone: 'Europe/Paris',
  layout: 'fr-online-freesheet',
  domain: '20minutes.fr',
  theme: {
    fonts: {
      headline: {
        family: 'Source Serif 4',
        face: 'source-serif-4',
        fallback: 'Georgia, "Times New Roman", serif',
        weights: [400, 600, 700],
      },
      body: {
        family: 'Source Serif 4',
        face: 'source-serif-4',
        fallback: 'Georgia, "Times New Roman", serif',
        weights: [400, 600, 700],
      },
      ui: {
        family: '20 Minutes Sans Stand-in',
        face: 'inter',
        fallback: 'Arial, Helvetica, sans-serif',
        weights: [400, 700],
      },
    },
    colors: {
      // Headlines, chapeau and body are all a flat black, not the near black the broadsheets
      // use.
      text: '#000000',
      // The kicker, the timestamp and the caption, all the same grey.
      muted: '#6a6a6a',
      // The ultramarine. A surface more than an accent: the band, the pills, the section rule.
      accent: '#4742ff',
      // It is dark enough to carry white, which is what the masthead and the pills do.
      onAccent: '#ffffff',
      // The dominant hairline on an article page, on twenty-two separate elements.
      rule: '#dddddd',
      // Measured, and off white by one unit in blue rather than plain `#ffffff`.
      background: '#fffffe',
      // The kicker that runs inline before the standfirst, in the same grey as the timestamp.
      sectionTag: '#6a6a6a',
    },
    scale: {
      headlineSize: 48,
      headlineWeight: 700,
      // 57.6px over 48px, as measured.
      headlineLeading: 1.2,
      // The body column, not the headline's, which runs the full 1024px content width.
      measure: 592,
    },
    // The 1024px content width. It was a literal in the freesheet layout until the theme had
    // somewhere to put it, which is the gap the whole `hero` field closed.
    hero: { measure: 1024, align: 'left' },
    masthead: { kind: 'wordmark', source: '20 Minutes' },
  },
  conventions: {
    navSections: ['Actualité', 'Société', 'Monde', 'Economie', 'High-Tech', 'Planète'],
    // 'Publié le 12/08/2026 à 17h32'. Numeric, where Le Monde writes the month out.
    dateFormat: 'fr-numeric',
    // No prefix. An article is signed '20 Minutes avec agence' or with a reporter's name, bare.
    bylinePrefix: '',
    sectionDefault: 'Société',
    headlineCase: 'sentence',
    updatedLabel: 'Publié le',
  },
  fidelity:
    'The headline and body face is the one exception in this repository: 20 Minutes sets its ' +
    'pages in Source Serif Pro, which is open-licensed, and the bundled Source Serif 4 is its ' +
    'successor, so the letterforms are the same design rather than a stand-in for it. Nothing ' +
    'else is. Inter stands in for the interface sans, where the real site uses a system stack ' +
    'that resolves to Arial. The masthead is the words 20 Minutes set in that stand-in sans: ' +
    'the real one is a lockup whose recognisable part is the ring device drawn into the zero, ' +
    'and that device is a trademark and is not redrawn here. Colours, sizes and both column ' +
    'widths were measured from three live article pages and are close. What remains ' +
    'approximate is the arrangement of the furniture around the story, which is reproduced ' +
    'in the spirit of the page rather than element for element.',
};
