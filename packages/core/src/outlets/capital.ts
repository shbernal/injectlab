import type { Outlet } from './types.js';

/**
 * Capital.
 *
 * Measured from three live articles, in `entreprises-marches` (twice) and `economie-politique`,
 * at a 1280 viewport. Capital answers an automated visit with the article, so these are live
 * captures rather than the saved-page path Le Monde and Les Echos needed. A consent dialog
 * covers the top of the screenshot and none of the measurements: it is an overlay, and
 * `getComputedStyle` reads the article underneath it exactly as it is drawn.
 *
 * All three agreed on every number below. The oldest of them, from 2019, carries no chapeau
 * and no reporter's name, which is worth knowing when reading the record: the two fields are
 * optional on the real site rather than absent from the template.
 *
 * The headline is the departure. 44px over a 52.8px line at weight 700, in Roboto Condensed,
 * running 816px where the story column below it is 628px. Nothing bundled is condensed, so
 * this record sets a headline in a face that is a good deal wider than the real one, and a
 * Capital headline that wraps to three lines on the real site may take four here. That is the
 * largest single compromise in the file and it is the first thing to fix if the catalogue ever
 * grows a condensed grotesque.
 *
 * The body face is the opposite case. Capital sets its story in Open Sans, and the bundled
 * Noto Sans is the same skeleton by the same designer, so the text of an article is close in a
 * way the headline is not.
 *
 * `#fdfd5d` is the signature yellow, and it is a subscriber colour like Le Monde's and Les
 * Echos's rather than a highlight: on an article page it fills the S'abonner button and
 * essentially nothing else. Too light to carry white, so `onAccent` is the near black.
 *
 * `#0c111d` does two jobs, which is why it is `text` here and a band elsewhere. It is the
 * colour of the headline, the chapeau and every paragraph, and it is also the fill of the
 * navigation bar under the masthead. That bar is the reason this record needed a layout that
 * could draw the section row as a surface rather than as a quiet line of type.
 *
 * This was authored against `fr-online-daily` first, which is the cheaper answer and was worth
 * trying before writing a fourth layout. What that render got right was the type and the two
 * measures; what it got wrong was the whole top of the page and where the story sits. See the
 * note in `fr-online-magazine` for the three differences that no value could express.
 */
export const capital: Outlet = {
  id: 'capital',
  name: 'Capital',
  country: 'fr',
  locale: 'fr-FR',
  timeZone: 'Europe/Paris',
  layout: 'fr-online-magazine',
  domain: 'capital.fr',
  theme: {
    fonts: {
      // Stands in for Roboto Condensed and is not condensed. See the note above.
      headline: {
        family: 'Capital Condensed Stand-in',
        face: 'libre-franklin',
        fallback: '"Arial Narrow", Arial, sans-serif',
        weights: [400, 700],
      },
      body: {
        family: 'Capital Sans Stand-in',
        face: 'noto-sans',
        fallback: 'Arial, Helvetica, sans-serif',
        weights: [400, 600, 700],
      },
      // The nav bar and the subscribe button are the headline face, not the story's.
      ui: {
        family: 'Capital Condensed Stand-in',
        face: 'libre-franklin',
        fallback: '"Arial Narrow", Arial, sans-serif',
        weights: [400, 700],
      },
    },
    colors: {
      // Headline, chapeau, byline and story, all the same near black. Also the nav bar's fill.
      text: '#0c111d',
      // The breadcrumb, the timestamp, the caption and the credit line, all one grey.
      muted: '#667085',
      // The signature yellow. On an article page, the subscribe button and nothing else.
      accent: '#fdfd5d',
      // Far too light for white, so the button carries the headline colour.
      onAccent: '#0c111d',
      // The dominant hairline on an article page, on twenty-nine separate elements.
      rule: '#d0d5dd',
      background: '#ffffff',
      // Capital colours no rubric. It prints a breadcrumb in the same grey as the timestamp,
      // so this is that grey rather than a brand colour the page does not have.
      sectionTag: '#667085',
    },
    scale: {
      headlineSize: 44,
      headlineWeight: 700,
      // 52.8px over 44px, as measured.
      headlineLeading: 1.2,
      // The story column. The rail of related items and advertising beside it is what makes
      // this narrower than the headline block above.
      measure: 628,
    },
    // 85% of the 960px content box, measured. Left, not centred: Capital is the third
    // arrangement this field has had to express and the first that is wide and ranged left.
    hero: { measure: 816, align: 'left' },
    masthead: { kind: 'wordmark', source: 'Capital' },
  },
  conventions: {
    // Six of the eleven the real bar carries. A business magazine's row is personal finance
    // more than it is business, which is the half that tells it apart from Les Echos.
    navSections: [
      'Fil d’infos',
      'Économie et Société',
      'Business',
      'Votre argent',
      'Immobilier',
      'Vie au travail',
    ],
    // 'Publié le 20 février 2019 à 11h10.' The month written out, as both other French
    // outlets write it. A story published today says 'aujourd'hui' instead, which is not
    // reproduced: a dated exercise inject wants the date.
    dateFormat: 'fr-long',
    bylinePrefix: 'Par ',
    sectionDefault: 'Business',
    headlineCase: 'sentence',
    updatedLabel: 'Publié le',
  },
  fidelity:
    'Typography is approximated, and less closely than the other records here. Capital sets ' +
    'its headlines in Roboto Condensed and nothing in the bundled catalogue is condensed, so ' +
    'Libre Franklin stands in at the right size and weight but a good deal wider: a headline ' +
    'that wraps to three lines on the real site may take four here, and the page reads ' +
    'heavier at the top than it should. The story is the opposite case, since Noto Sans and ' +
    'the real Open Sans are the same skeleton by the same designer. The masthead is the word ' +
    'Capital set in that stand-in: the real one is a drawn wordmark sitting over a tagline, ' +
    'and neither the letterforms nor the tagline are reproduced. Colours, sizes and both ' +
    'column widths were measured from three live article pages and are close. Two known ' +
    'departures in the furniture: the rail beside the story is populated with generic items ' +
    'and a labelled advertising slot rather than anything real, since it exists so a reader ' +
    'sees a filled column and not so it can be read, and a story published on the day is ' +
    "dated 'aujourd'hui' on the real site where this gives the date, because an exercise " +
    'inject is read against a scenario clock.',
};
