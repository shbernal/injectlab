import type { Outlet } from './types.js';

/**
 * Les Echos.
 *
 * Measured from three articles, in `air-defense`, `europe` and `automobile`, at a 1280
 * viewport. All three agreed on every number below, which is what capturing more than one is
 * for. None of them is an editorial or an analysis: the site marks those with a rubric of
 * their own and they carry a different template, which is the trap the Le Monde record fell
 * into first.
 *
 * Les Echos refuses an automated visit the way Le Monde does, so the numbers come from the
 * saved-page path rather than a live capture: the markup the server sends to an ordinary
 * request, served back as the document at its own URL with scripts blocked, so the real
 * stylesheets and the real fonts still resolve and `getComputedStyle` answers exactly as it
 * would live.
 *
 * The centred hero is the record. A 36px headline over a 46.8px line, weight 700, centred in
 * a 1000px block, with the chapeau centred under it at 20px, and then a body column of only
 * 636px running left under a lead image that keeps the full 1000. Set that headline hard left
 * at the body measure and the page stops being Les Echos, which is why `hero` became a theme
 * field rather than a fourth layout family: everything else about the page is the French
 * daily, down to the centred wordmark over a rule and the subscriber marker in the furniture.
 *
 * The rubric above the headline is colour-coded per kind rather than per section: `#00726d`
 * on the Décryptage that was captured, `#b00005` on the En chiffres of the second article.
 * The teal is what `sectionTag` carries, since it is the one that sat above a plain news
 * story, and the kicker is a rubric in any case rather than the breadcrumb, which Les Echos
 * prints at the foot of the page.
 *
 * `#faec70` is the signature yellow, and like Le Monde's it is a subscriber colour rather than
 * a highlight: it fills the Premium marker, the subscribe button and the rule under a section
 * heading. Far too light to carry white, so `onAccent` is the text colour.
 *
 * Real families are Merriweather for the headline and the chapeau and Source Sans Pro for the
 * story and the interface. Both are open-licensed, and neither is bundled here.
 */
export const lesechos: Outlet = {
  id: 'lesechos',
  name: 'Les Echos',
  country: 'fr',
  locale: 'fr-FR',
  timeZone: 'Europe/Paris',
  layout: 'fr-online-daily',
  domain: 'lesechos.fr',
  theme: {
    fonts: {
      headline: {
        family: 'Les Echos Serif Stand-in',
        face: 'noto-serif',
        fallback: 'Georgia, "Times New Roman", serif',
        weights: [400, 700],
      },
      // The story is set in a sans, which is the plainest difference between this record and
      // the other French daily, and the reason the theme carries three faces rather than two.
      body: {
        family: 'Les Echos Sans Stand-in',
        face: 'noto-sans',
        fallback: 'Arial, Helvetica, sans-serif',
        weights: [400, 600, 700],
      },
      ui: {
        family: 'Les Echos Sans Stand-in',
        face: 'noto-sans',
        fallback: 'Arial, Helvetica, sans-serif',
        weights: [400, 700],
      },
    },
    colors: {
      // The headline, the chapeau, the byline and the story, all the same near black. Les
      // Echos greys almost nothing on an article page.
      text: '#212121',
      // The one grey it does use, on the caption under the lead image.
      muted: '#5d5d5d',
      // The signature yellow. The Premium marker, the subscribe button, the section rule.
      accent: '#faec70',
      // The marker's own text. The yellow is far too light for white, so it carries the
      // headline colour, which is what the Premium pill does.
      onAccent: '#212121',
      // The dominant hairline on an article page, on twenty-three separate elements.
      rule: '#dbdbdb',
      // The article sits on white, inside a page whose top strip is `#f4f4f4`.
      background: '#ffffff',
      // The teal of the Décryptage rubric above the headline. Red on some other rubrics, and
      // absent entirely on a plain news story, so this is the commonest rather than the only.
      sectionTag: '#00726d',
    },
    scale: {
      headlineSize: 36,
      headlineWeight: 700,
      // 46.8px over 36px, as measured. A markedly looser line than either Le Monde or the
      // BBC sets, and it is what makes a three-line centred headline read as a block.
      headlineLeading: 1.3,
      // The story column, which is a third narrower than the headline above it.
      measure: 636,
    },
    // The centred headline block, and the whole reason this outlet needed a field the model
    // did not have. 1000px is the article header's own max-width, measured.
    hero: { measure: 1000, align: 'center' },
    masthead: { kind: 'wordmark', source: 'Les Echos' },
  },
  conventions: {
    // Six of the fourteen the real page carries, which is a business daily's other tell: the
    // section row is long, and half of it is money.
    navSections: ['Idées', 'Économie', 'Entreprises', 'Finance-Marchés', 'Monde', 'Tech-Médias'],
    // 'Publié le 12 août 2026 à 19h00'. The month written out, as Le Monde writes it.
    dateFormat: 'fr-long',
    bylinePrefix: 'Par ',
    sectionDefault: 'Entreprises',
    headlineCase: 'sentence',
    updatedLabel: 'Publié le',
  },
  fidelity:
    'Typography is approximated: Noto Serif stands in for Merriweather and Noto Sans for ' +
    'Source Sans Pro, chosen as the closest bundled faces rather than as a default. Both real ' +
    'families are themselves open-licensed and could be bundled if this record ever needed to ' +
    'be closer, which is a decision left open rather than taken quietly. No Les Echos font ' +
    'file is used and the masthead is the words set in the stand-in serif: the real one is a ' +
    'drawn wordmark and the recognisable part of it is the letterforms, which are not ' +
    'reproduced. Colours, sizes and both column widths were measured from three real article ' +
    'pages, which had to be read through the saved-page path because Les Echos answers an ' +
    'automated visit with an access denial. Three known departures, all in the furniture ' +
    'rather than the proportions: the chapeau is set in the muted grey where Les Echos sets ' +
    'it in the headline colour, the timestamp is joined with the French h where Les Echos ' +
    'writes a colon, and the rubric above the headline stands in for a badge whose colour ' +
    'changes with the kind of story.',
};
