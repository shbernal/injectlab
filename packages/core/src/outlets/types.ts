/**
 * What an outlet is.
 *
 * This is the load-bearing type in the project. Adding an outlet has to stay a data-authoring
 * task, which means every visual difference between two outlets in the same layout family has
 * to be expressible here. If a new outlet needs a code change, either the theme is missing a
 * field or the outlet genuinely belongs to a new layout family.
 *
 * Read this before authoring one, because it is the moment the rule matters:
 *
 * **Fonts and marks are stand-ins, never the real assets.** Outlets set their pages in
 * licensed typefaces and head them with trademarked logos. Neither may enter this
 * repository. A theme names an open-licensed face from the bundled catalogue, chosen for
 * visual proximity, and a masthead is either a wordmark set in that face or a simplified
 * redraw. Every outlet states what it approximates in `fidelity`, and that field is asserted
 * to be non-trivial by the registry test.
 *
 * Improving fidelity by fetching the real logo or the real font is not an improvement. It is
 * the one change this file exists to prevent.
 */

import type { TypefaceId } from '../fonts/catalogue.js';

/**
 * A layout function, shared by every outlet that uses it. Outlets in the same family differ
 * only by theme data.
 *
 * Resist adding one family per outlet. That is the failure mode that makes the tenth outlet
 * as expensive as the first, and it is easy to reach one small concession at a time.
 */
export type LayoutFamily = 'uk-online-broadsheet' | 'fr-online-daily';

export type { TypefaceId };

/**
 * A typeface as the theme refers to it. The files live in the bundled catalogue and are
 * resolved, embedded and cached at render time.
 */
export interface FontSpec {
  /** Family name declared in the composed CSS. */
  family: string;
  /** Which bundled, open-licensed typeface backs it. */
  face: TypefaceId;
  /** Generic stack appended after the embedded family, in case embedding is ever skipped. */
  fallback: string;
  /** Weights the layout is allowed to ask for. Must fall inside the face's variable range. */
  weights: readonly number[];
}

/** Everything a layout reads to draw the outlet's look. No layout hardcodes an outlet value. */
export interface OutletTheme {
  fonts: { headline: FontSpec; body: FontSpec; ui: FontSpec };
  colors: {
    text: string;
    muted: string;
    accent: string;
    rule: string;
    background: string;
    sectionTag: string;
  };
  scale: {
    headlineSize: number;
    headlineWeight: number;
    headlineLeading: number;
    /** Body column width in CSS pixels. */
    measure: number;
  };
  masthead:
    | { kind: 'wordmark'; source: string }
    /** Inline SVG, redrawn and simplified. Never a real logo file. */
    | { kind: 'svg'; source: string };
}

/** How this outlet writes the furniture around the story. */
export interface OutletConventions {
  dateFormat: DateFormat;
  /** 'By ', 'Par '. Empty string for outlets that print the name bare. */
  bylinePrefix: string;
  sectionDefault: string;
  headlineCase: 'sentence' | 'title';
  /** 'Published', 'Publié le'. */
  updatedLabel: string;
}

export type DateFormat = 'uk-long' | 'fr-long' | 'iso';

export interface Outlet {
  id: string;
  /** 'BBC News'. */
  name: string;
  country: 'uk' | 'fr' | 'de' | 'us';
  /** BCP 47, for date formatting. */
  locale: string;
  /** IANA zone. The host time zone is never read. */
  timeZone: string;
  layout: LayoutFamily;
  /** 'bbc.co.uk/news', for the address bar and for synthesising a plausible article URL. */
  domain: string;
  theme: OutletTheme;
  conventions: OutletConventions;
  /**
   * What this outlet approximates and why, in plain words. Required, and surfaced by
   * `inject outlets --verbose`, because the honest answer to "is that the real masthead" has
   * to be available without reading the source.
   */
  fidelity: string;
}
