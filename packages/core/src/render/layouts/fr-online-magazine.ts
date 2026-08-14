import { html, raw } from '../html.js';
import type { Html } from '../html.js';
import type { ArticleView } from '../view.js';

/**
 * The French online business magazine: a centred wordmark on a light strip, a solid full-bleed
 * section bar under it, a plain-text breadcrumb, a wide headline ranged left, and then a story
 * column flush under that same left edge with a rail of related items and advertising filling
 * the width the headline had.
 *
 * A fourth family, and the case for it is the two bands at the top. The daily centres a
 * wordmark over a rule and draws its section row as a quiet line of type; the freesheet paints
 * a saturated band and puts the wordmark inside it. Capital does neither: the mark sits on
 * white, and the section row under it is a solid near-black surface the mark is not part of.
 * Trying it as the freesheet is where this became clear, because that band takes `--il-accent`
 * as its fill, and Capital's accent is the yellow on its subscribe button. Rendering the page
 * would have meant recording the wrong colour as the brand's, which is the sort of quiet lie
 * an outlet record exists to prevent.
 *
 * The second reason is the left edge. Both French dailies centre every band, and with a hero
 * measure wider than the body that reads as a narrow column floating under a wide headline.
 * Here the two are flush against one edge and the difference between them is occupied, not
 * empty: on a real page it is the rail. Centring the story column under the headline puts the
 * body somewhere Capital never puts it.
 *
 * No subscriber marker, which the daily draws unconditionally. Both outlets in that family
 * put an article behind a wall and say so in the furniture. Capital does not, and a page that
 * announces a subscription the outlet is not asking for is wrong about the outlet.
 */

/**
 * The rail, as furniture rather than content.
 *
 * Generic and never drawn from the inject, for the reason the other families give: a reader
 * takes in that the column is populated without reading it, and inventing extra stories here
 * would be inventing content nobody asked for. The advertising slot is a labelled grey box
 * because that is exactly what the real page shows before its ads load, and a labelled grey
 * box invents nothing at all.
 */
const RAIL_ITEMS = [
  { time: '14h02', text: 'Épargne : ce que change le nouveau plafond du livret A' },
  { time: '13h35', text: 'Ces trois valeurs industrielles qui résistent le mieux' },
  { time: '12h58', text: 'Assurance cyber : les PME encore très peu couvertes' },
  { time: '11h40', text: 'Retraite : le calendrier des revalorisations de septembre' },
];

export const FR_ONLINE_MAGAZINE_CSS = `
.mag-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 16px 40px;
}
.mag-wordmark {
  font-family: var(--il-font-headline);
  font-weight: 700;
  font-size: 38px;
  letter-spacing: -0.01em;
  color: var(--il-text);
}
/* Centred like the wordmark it replaces, at roughly its cap height. */
.mag-supplied { display: block; height: 44px; width: auto; }
/* Balances the subscribe button so the mark lands centred between them. Empty on purpose:
   the real strip carries a newsstand card here, which is furniture this does not reproduce. */
.mag-topbar-spacer { flex: 1; }
.mag-topbar-mark { flex: 0 0 auto; }
.mag-topbar-end { flex: 1; display: flex; justify-content: flex-end; }
.mag-subscribe {
  font-family: var(--il-font-ui);
  font-size: 18px;
  font-weight: 700;
  color: var(--il-on-accent);
  background: var(--il-accent);
  padding: 9px 24px;
}
/* The band. Full bleed, and the reason this family exists. */
.mag-navbar {
  background: var(--il-text);
  padding: 0 40px;
}
.mag-nav {
  font-family: var(--il-font-ui);
  font-size: 16px;
  font-weight: 700;
  color: var(--il-bg);
  display: flex;
  gap: 28px;
  align-items: center;
  height: 48px;
}
/* 628 + 40 gap + 292 rail, all measured, which is the 960px content box the real page runs
   its article in. Written from the body measure out so the rail keeps its width when an
   outlet in this family sets a different column. */
.mag-shell {
  max-width: calc(var(--il-measure) + 332px);
  margin: 0 auto;
  padding: 26px 20px 64px;
}
.mag-head {
  max-width: var(--il-hero-measure);
  text-align: var(--il-hero-align);
}
.mag-crumbs {
  font-family: var(--il-font-ui);
  font-size: 14px;
  color: var(--il-section);
  margin-bottom: 16px;
}
.mag-headline {
  font-family: var(--il-font-headline);
  font-size: var(--il-headline-size);
  font-weight: var(--il-headline-weight);
  line-height: var(--il-headline-leading);
  margin-bottom: 18px;
}
/* The body face and the text colour, not the headline face and not the muted grey. Both are
   measured, and both are the opposite of what the daily family does with a chapeau. */
.mag-chapeau {
  font-size: 20px;
  line-height: 1.6;
  color: var(--il-text);
  margin-bottom: 30px;
}
.mag-cols {
  display: grid;
  grid-template-columns: var(--il-measure) 1fr;
  gap: 40px;
  align-items: start;
}
.mag-figure { margin-bottom: 20px; }
.mag-caption {
  font-family: var(--il-font-ui);
  font-size: 12px;
  color: var(--il-muted);
  padding-top: 8px;
  line-height: 1.4;
}
.mag-byline {
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid var(--il-rule);
  padding-bottom: 16px;
  margin-bottom: 24px;
}
/* The round author portrait the real signature leads with, as a shape and nothing more. */
.mag-avatar {
  flex: 0 0 auto;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--il-rule);
}
.mag-byline-text { font-family: var(--il-font-ui); font-size: 14px; color: var(--il-text); }
.mag-byline-text strong { font-weight: 700; }
.mag-byline-text span { display: block; font-size: 12px; color: var(--il-muted); margin-top: 4px; }
.mag-body { font-size: 18px; line-height: 1.6; margin-bottom: 22px; }
.mag-rail-title {
  font-family: var(--il-font-ui);
  font-size: 16px;
  font-weight: 700;
  color: var(--il-text);
  border-bottom: 2px solid var(--il-text);
  padding-bottom: 8px;
  margin-bottom: 4px;
}
.mag-rail-item { padding: 14px 0; border-bottom: 1px solid var(--il-rule); }
.mag-rail-time {
  font-family: var(--il-font-ui);
  font-size: 12px;
  color: var(--il-muted);
  display: block;
  margin-bottom: 5px;
}
.mag-rail-text {
  font-family: var(--il-font-headline);
  font-size: 15px;
  font-weight: 700;
  line-height: 1.3;
  color: var(--il-text);
}
.mag-slot {
  margin-top: 24px;
  height: 250px;
  background: var(--il-rule);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--il-font-ui);
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--il-muted);
}
`.trim();

function masthead(view: ArticleView): Html {
  const mark = view.masthead;
  if (mark.kind === 'wordmark') return html`<div class="mag-wordmark">${mark.source}</div>`;
  if (mark.kind === 'svg') return raw(mark.source);

  // See the note in the UK family: `Number` because this reaches a style attribute.
  const style = mark.height === undefined ? '' : `height:${Number(mark.height)}px`;

  return html`<img class="mag-supplied" src="${mark.src}" alt="${mark.alt}" style="${style}" />`;
}

export function frOnlineMagazine(view: ArticleView): Html {
  return html`
    <header>
      <div class="mag-topbar">
        <span class="mag-topbar-spacer"></span>
        <span class="mag-topbar-mark">${masthead(view)}</span>
        <span class="mag-topbar-end"><span class="mag-subscribe">S'abonner</span></span>
      </div>
      <div class="mag-navbar">
        <nav class="mag-nav">
          ${view.navSections.map((section) => html`<span>${section}</span>`)}
        </nav>
      </div>
    </header>
    <div class="mag-shell">
      <div class="mag-head">
        <div class="mag-crumbs">Accueil &rsaquo; ${view.section}</div>
        <h1 class="mag-headline">${view.headline}</h1>
        ${view.standfirst !== '' && html`<p class="mag-chapeau">${view.standfirst}</p>`}
      </div>
      <div class="mag-cols">
        <article>
          ${
            view.image !== undefined &&
            html`
              <figure class="mag-figure">
                <img src="${view.image.src}" alt="" />
                <figcaption class="mag-caption">
                  ${view.image.caption}${view.image.credit !== '' && html` ${view.image.credit}`}
                </figcaption>
              </figure>
            `
          }
          <div class="mag-byline">
            <span class="mag-avatar"></span>
            <span class="mag-byline-text">
              ${view.byline !== '' && html`<strong>${view.byline}</strong>`}
              <span>${view.timestamp}</span>
            </span>
          </div>
          ${view.body.map((paragraph) => html`<p class="mag-body">${paragraph}</p>`)}
        </article>
        <aside>
          <div class="mag-rail-title">${view.section}</div>
          ${RAIL_ITEMS.map(
            (item) => html`
              <div class="mag-rail-item">
                <span class="mag-rail-time">${item.time}</span>
                <span class="mag-rail-text">${item.text}</span>
              </div>
            `,
          )}
          <div class="mag-slot">Publicité</div>
        </aside>
      </div>
    </div>
  `;
}
