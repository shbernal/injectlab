import { html, EMPTY } from './html.js';
import type { Html } from './html.js';

/**
 * Exercise framing.
 *
 * The convention in crisis exercises is that every artefact, and every message carrying one,
 * is marked in the clear as exercise material. The banner is part of the page rather than an
 * overlay drawn onto the PNG afterwards, so it scales with the screenshot and behaves like
 * any other element.
 *
 * Turning the band off does not turn off the embedded PNG provenance. That is deliberate and
 * not switchable: the visible band serves the person looking at the asset, and the metadata
 * serves whoever finds the file later with no idea where it came from.
 */

/** Banner text used when a spec does not override it. */
export const DEFAULT_DISCLAIMER = '[EXERCISE, EXERCISE, EXERCISE]';

/** Passing this as the disclaimer omits the bands. */
export const NO_DISCLAIMER = 'none';

/**
 * How loudly the framing is drawn.
 *
 * The text says the same thing in all three. What varies is how much of the asset the framing
 * takes, and that is a real editorial choice rather than decoration: an inject shown on a
 * screen in a control room wants the loud band, and one pasted into an email that already
 * says EXERCISE three times wants the quiet line under it. Offering only the loudest is how
 * you get designers cropping it off, which is worse than any of these.
 *
 * - `bold`  red wording, no fill, top only. The default.
 * - `band`  the yellow band with red rules, top and bottom. The loudest.
 * - `quiet` small letters in the page's own muted colour over a hairline, top only.
 */
export type DisclaimerStyle = 'bold' | 'band' | 'quiet';

type Position = 'top' | 'bottom';

/**
 * Where each style draws.
 *
 * Only `band` draws twice, and giving that up for the other two is the one deliberate
 * concession here. A second band survives the realistic way an asset loses its framing,
 * which is someone screenshotting the interesting half out of an email. A `bold` or `quiet`
 * inject cropped below its first line carries nothing visible, and the embedded PNG
 * provenance is all that is left. That is the trade the loud style exists to refuse, so it
 * is stated rather than buried, and `band` is one flag away.
 */
const POSITIONS: Record<DisclaimerStyle, readonly Position[]> = {
  bold: ['top'],
  band: ['top', 'bottom'],
  quiet: ['top'],
};

export const DEFAULT_DISCLAIMER_STYLE: DisclaimerStyle = 'bold';

/** Default first, then loudest to quietest, which is the order the help text wants. */
export const DISCLAIMER_STYLES = Object.keys(POSITIONS) as readonly DisclaimerStyle[];

/**
 * All three styles, in every document.
 *
 * Emitting only the selected one would save a dozen lines of CSS per asset and cost a branch
 * in the composer. The dozen lines are the cheaper of the two, and a document carrying rules
 * it does not use is still byte-for-byte deterministic.
 */
export const DISCLAIMER_CSS = `
.il-exercise {
  font-family: var(--il-font-ui);
  font-weight: 700;
  text-align: center;
  text-transform: uppercase;
}

.il-exercise--bold {
  color: #d81f2a;
  font-size: 15px;
  letter-spacing: 0.13em;
  padding: 11px 8px;
}

.il-exercise--band {
  background: #ffd400;
  color: #000;
  font-size: 20px;
  letter-spacing: 0.14em;
  padding: 14px 8px;
}
.il-exercise--band.il-exercise--top { border-bottom: 3px solid #b80000; }
.il-exercise--band.il-exercise--bottom { border-top: 3px solid #b80000; }

.il-exercise--quiet {
  color: var(--il-muted);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.16em;
  padding: 8px;
}
.il-exercise--quiet.il-exercise--top { border-bottom: 1px solid var(--il-rule); }
.il-exercise--quiet.il-exercise--bottom { border-top: 1px solid var(--il-rule); }
`.trim();

/**
 * One band, or nothing.
 *
 * Returns `EMPTY` both when the disclaimer is off and when the style does not draw at this
 * position, so the composer asks for top and bottom unconditionally and the style decides.
 *
 * Two of the three styles have no fill of their own and sit on whatever the page's background
 * is, which for an X post is black. `quiet` handles that by borrowing `--il-muted`, defined by
 * every outlet theme and by all three platform palettes, so it reads as page furniture
 * wherever it lands. `bold` cannot: an outlet's own colours are exactly what it must not look
 * like, and `--il-accent` is a yellow at Le Monde. So its red is a literal, and the one chosen
 * clears 4:1 against both white and black.
 */
export function disclaimerBand(
  text: string,
  position: Position,
  style: DisclaimerStyle = DEFAULT_DISCLAIMER_STYLE,
): Html {
  if (text === NO_DISCLAIMER) return EMPTY;
  if (!POSITIONS[style].includes(position)) return EMPTY;

  // Assembled before the template rather than interpolated into it, so the element stays on
  // one line. Wrapped, the formatter would put the text on its own line and put whitespace
  // inside the band that is not in any other element on the page.
  const classes = `il-exercise il-exercise--${style} il-exercise--${position}`;
  return html`<div class="${classes}">${text}</div>`;
}
