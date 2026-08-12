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

export const DISCLAIMER_CSS = `
.il-exercise {
  background: #ffd400;
  color: #000;
  font-family: var(--il-font-ui);
  font-weight: 700;
  font-size: 20px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  text-align: center;
  padding: 14px 8px;
}
.il-exercise--top { border-bottom: 3px solid #b80000; }
.il-exercise--bottom { border-top: 3px solid #b80000; }
`.trim();

/**
 * Two bands, top and bottom, both on by default.
 *
 * The second one costs nothing and survives a crop of the first, which is the realistic way
 * an asset loses its framing: someone screenshots the interesting half out of the email.
 */
export function disclaimerBand(text: string, position: 'top' | 'bottom'): Html {
  if (text === NO_DISCLAIMER) return EMPTY;
  return html`<div class="il-exercise il-exercise--${position}">${text}</div>`;
}
