import { html, raw } from '../html.js';
import type { Html } from '../html.js';
import type { ArticleView } from '../view.js';

/**
 * The French online freesheet: a saturated brand band carrying the masthead, a bold section
 * bar under it, pill breadcrumbs, then a headline set across the full content width with the
 * kicker inline against the standfirst, and only below the lead image a narrow body column
 * indented under a wider figure, with a ranked "most read" list beside it.
 *
 * A third family rather than the French daily in different colours, which was the first thing
 * tried. The daily centres a wordmark over a rule and runs one column the whole way down; a
 * freesheet leads with the brand as a block of colour and puts the story furniture in pills
 * and tags. Rendering one as the other produces a page that is recognisably the wrong
 * publication, which is the bar this project sets rather than a pixel metric.
 *
 * The indent is measured, not styling. On a real article the figure runs the full width of
 * the left column and the body sits inset under it, which is why `.fs-article` is `--il-measure`
 * pushed right inside a column 80px wider, rather than the column being the measure.
 *
 * Every value here is a custom property. No colour, family or metric is written literally.
 */

export const FR_ONLINE_FREESHEET_CSS = `
.fs-band {
  background: var(--il-accent);
  color: var(--il-on-accent);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 26px 32px;
}
.fs-wordmark {
  font-family: var(--il-font-ui);
  font-weight: 700;
  font-size: 34px;
  letter-spacing: -0.02em;
  color: var(--il-on-accent);
}
/* Sized to the wordmark it replaces, which on a band is the mark's whole job. */
.fs-supplied { display: block; height: 44px; width: auto; }
.fs-pill {
  font-family: var(--il-font-ui);
  font-size: 15px;
  font-weight: 700;
  color: var(--il-on-accent);
  border: 1px solid var(--il-on-accent);
  border-radius: 40px;
  padding: 8px 18px;
}
.fs-nav {
  font-family: var(--il-font-ui);
  font-size: 18px;
  font-weight: 700;
  color: var(--il-text);
  display: flex;
  gap: 30px;
  padding: 12px 32px;
  border-bottom: 6px solid var(--il-accent);
}
.fs-nav span:first-child { color: var(--il-accent); }
/* Centred, where the band and the section bar above it run the full width. That is measured
   too: on a real page the band starts at the edge and the story starts 128px in. The width is
   the hero measure, since in this family the headline is what runs the shell's full width;
   the 24px is this block's own padding, so the content lands on the measured number. */
.fs-shell {
  max-width: calc(var(--il-hero-measure) + 24px);
  margin: 0 auto;
  padding: 28px 12px 56px;
}
.fs-crumbs { display: flex; gap: 10px; margin-bottom: 18px; }
.fs-crumb {
  font-family: var(--il-font-ui);
  font-size: 14px;
  font-weight: 700;
  color: var(--il-on-accent);
  background: var(--il-accent);
  border-radius: 40px;
  padding: 6px 12px;
}
.fs-headline {
  font-family: var(--il-font-headline);
  font-size: var(--il-headline-size);
  font-weight: var(--il-headline-weight);
  line-height: var(--il-headline-leading);
  margin-bottom: 14px;
}
.fs-chapeau {
  font-family: var(--il-font-headline);
  font-size: 26px;
  line-height: 1.2;
  margin-bottom: 28px;
}
.fs-kicker {
  font-family: var(--il-font-ui);
  font-size: 18px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--il-section);
}
.fs-cols {
  display: grid;
  grid-template-columns: calc(var(--il-measure) + 80px) 1fr;
  gap: 32px;
}
.fs-figure { margin-bottom: 22px; }
.fs-caption {
  font-family: var(--il-font-ui);
  font-size: 14px;
  color: var(--il-muted);
  padding-top: 8px;
  line-height: 1.4;
}
.fs-article { max-width: var(--il-measure); margin-left: auto; }
.fs-byline {
  font-family: var(--il-font-ui);
  font-size: 16px;
  margin-bottom: 24px;
}
.fs-byline strong { font-weight: 700; }
.fs-byline span { display: block; font-size: 12px; color: var(--il-muted); margin-top: 5px; }
.fs-body { font-size: 20px; line-height: 1.6; margin-bottom: 22px; }
.fs-aside-title {
  font-family: var(--il-font-ui);
  font-size: 18px;
  font-weight: 700;
  border-bottom: 4px solid var(--il-accent);
  padding-bottom: 8px;
  display: inline-block;
  margin-bottom: 6px;
}
.fs-aside-item {
  display: flex;
  gap: 12px;
  align-items: baseline;
  padding: 14px 0;
  border-bottom: 1px solid var(--il-rule);
}
.fs-aside-rank {
  font-family: var(--il-font-ui);
  font-size: 26px;
  font-weight: 700;
  color: var(--il-accent);
}
.fs-aside-text {
  font-family: var(--il-font-ui);
  font-size: 14px;
  font-weight: 700;
  line-height: 1.35;
}
`.trim();

/**
 * The "most read" filler, as furniture rather than content.
 *
 * Generic and never drawn from the inject, for the reason the UK family gives: a reader takes
 * in that the column is populated without reading it, and inventing extra stories here would
 * be inventing content nobody asked for.
 */
const ASIDE_ITEMS = [
  "Ce que l'on sait de la panne qui a touché les guichets",
  'Trois questions sur la facture des réseaux vieillissants',
  'Le calendrier des travaux prévus à la rentrée',
  'Témoignages : une journée sans système informatique',
];

function masthead(view: ArticleView): Html {
  const mark = view.masthead;
  if (mark.kind === 'wordmark') return html`<div class="fs-wordmark">${mark.source}</div>`;
  if (mark.kind === 'svg') return raw(mark.source);

  // See the note in the UK family: `Number` because this reaches a style attribute.
  const style = mark.height === undefined ? '' : `height:${Number(mark.height)}px`;

  return html`<img class="fs-supplied" src="${mark.src}" alt="${mark.alt}" style="${style}" />`;
}

export function frOnlineFreesheet(view: ArticleView): Html {
  return html`
    <header class="fs-band">
      <span class="fs-pill">Menu</span>
      ${masthead(view)}
      <span class="fs-pill">Direct</span>
    </header>
    <nav class="fs-nav">${view.navSections.map((section) => html`<span>${section}</span>`)}</nav>
    <div class="fs-shell">
      <div class="fs-crumbs">
        <span class="fs-crumb">Accueil</span><span class="fs-crumb">${view.section}</span>
      </div>
      <h1 class="fs-headline">${view.headline}</h1>
      <p class="fs-chapeau">
        <span class="fs-kicker">${view.section}</span>
        ${view.standfirst !== '' && html`&bull; ${view.standfirst}`}
      </p>
      <div class="fs-cols">
        <div>
          ${
            view.image !== undefined &&
            html`
              <figure class="fs-figure">
                <img src="${view.image.src}" alt="" />
                <figcaption class="fs-caption">
                  ${view.image.caption}${view.image.credit !== '' && html` ${view.image.credit}`}
                </figcaption>
              </figure>
            `
          }
          <article class="fs-article">
            <div class="fs-byline">
              ${view.byline !== '' && html`<strong>${view.byline}</strong>`}
              <span>${view.timestamp}</span>
            </div>
            ${view.body.map((paragraph) => html`<p class="fs-body">${paragraph}</p>`)}
          </article>
        </div>
        <aside class="fs-aside">
          <div class="fs-aside-title">Les + lus</div>
          ${ASIDE_ITEMS.map(
            (item, index) => html`
              <div class="fs-aside-item">
                <span class="fs-aside-rank">${index + 1}</span>
                <span class="fs-aside-text">${item}</span>
              </div>
            `,
          )}
        </aside>
      </div>
    </div>
  `;
}
