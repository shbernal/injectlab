/**
 * What an outlet is.
 *
 * This is the load-bearing type in the project. Adding an outlet has to stay a data-authoring
 * task, which means every visual difference between two outlets in the same layout family has
 * to be expressible here. If a new outlet needs a code change, either the theme is missing a
 * field or the outlet genuinely belongs to a new layout family.
 */

/**
 * A layout function, shared by every outlet that uses it. Outlets in the same family differ
 * only by theme data.
 *
 * Resist adding one family per outlet. That is the failure mode that makes the tenth outlet
 * as expensive as the first, and it is easy to reach one small concession at a time.
 */
export type LayoutFamily = 'uk-online-broadsheet' | 'fr-online-daily';

/**
 * A typeface as the theme refers to it. The actual files live in the bundled font catalogue
 * and are resolved, embedded and cached at render time.
 */
export interface FontSpec {
  /** Family name declared in the composed CSS. */
  family: string;
  /** Catalogue id of the bundled, open-licensed typeface backing it. */
  face: string;
  /** Generic stack appended after the embedded family, in case embedding is ever skipped. */
  fallback: string;
  /** Weights the layout is allowed to ask for. */
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
  /** 'Published', 'Publie le'. */
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
