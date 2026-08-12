import { html, raw } from '../html.js';
import type { Html } from '../html.js';
import type { ArticleView } from '../view.js';

/**
 * The UK online broadsheet: masthead bar with section navigation, headline over standfirst,
 * a byline rule, a lead image, then the body in a narrow measure with a sidebar column
 * beside it.
 *
 * The sidebar is not decoration. Measuring a real article showed a 721px column inside a
 * 1248px container, and the render spike, which put nothing in that gap, read as a stripped
 * page rather than a real one. Filling it is the single largest thing separating a
 * convincing capture from an obviously synthetic one.
 *
 * Every value here is a custom property. No colour, family or metric is written literally,
 * because that is what keeps a new outlet a data change.
 */

export const UK_ONLINE_BROADSHEET_CSS = `
.uk-masthead {
  border-bottom: 1px solid var(--il-rule);
  padding: 14px 40px;
  display: flex;
  align-items: center;
  gap: 22px;
}
.uk-wordmark {
  font-family: var(--il-font-ui);
  font-weight: 700;
  font-size: 26px;
  letter-spacing: -0.02em;
  background: var(--il-text);
  color: var(--il-bg);
  padding: 4px 12px;
}
.uk-mark { display: flex; align-items: center; }
/* A supplied mark sits at the wordmark's optical height unless the spec says otherwise. */
.uk-supplied { display: block; height: 34px; width: auto; }
.uk-nav {
  font-family: var(--il-font-ui);
  font-size: 14px;
  font-weight: 500;
  display: flex;
  gap: 22px;
  color: var(--il-text);
}
.uk-shell {
  display: grid;
  grid-template-columns: var(--il-measure) 1fr;
  gap: 48px;
  max-width: 1248px;
  padding: 30px 40px 64px;
}
.uk-section {
  font-family: var(--il-font-ui);
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--il-section);
  margin-bottom: 12px;
}
.uk-headline {
  font-family: var(--il-font-headline);
  font-size: var(--il-headline-size);
  font-weight: var(--il-headline-weight);
  line-height: var(--il-headline-leading);
  letter-spacing: -0.01em;
  margin-bottom: 16px;
}
.uk-standfirst {
  font-family: var(--il-font-headline);
  font-size: 18px;
  font-weight: var(--il-headline-weight);
  line-height: 1.35;
  margin-bottom: 22px;
}
.uk-byline {
  font-family: var(--il-font-ui);
  font-size: 15px;
  border-top: 1px solid var(--il-rule);
  border-bottom: 1px solid var(--il-rule);
  padding: 13px 0;
  margin-bottom: 24px;
}
.uk-byline strong { font-weight: 700; }
.uk-byline span { color: var(--il-muted); display: block; font-size: 13px; margin-top: 3px; }
.uk-figure { margin-bottom: 24px; }
.uk-caption {
  font-family: var(--il-font-ui);
  font-size: 13px;
  color: var(--il-muted);
  padding-top: 8px;
}
.uk-credit { text-transform: uppercase; letter-spacing: 0.04em; font-size: 11px; }
.uk-body { font-size: 18px; line-height: 1.62; margin-bottom: 19px; }
.uk-body:first-of-type { font-weight: 600; }
.uk-aside { padding-top: 4px; }
.uk-aside-title {
  font-family: var(--il-font-ui);
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-top: 3px solid var(--il-accent);
  padding-top: 10px;
  margin-bottom: 14px;
}
.uk-aside-item {
  font-family: var(--il-font-headline);
  font-size: 16px;
  line-height: 1.3;
  padding: 12px 0;
  border-bottom: 1px solid var(--il-rule);
  color: var(--il-text);
}
`.trim();

/**
 * Sidebar filler.
 *
 * Generic on purpose, and never taken from the inject: these are furniture, and a reader
 * takes in that the column is populated without reading it. Inventing extra headlines here
 * would be inventing content nobody asked for.
 */
const ASIDE_ITEMS = [
  'Regulator opens review into weekend service disruption',
  'What we know so far about the outage',
  'Firms warned over supplier concentration risk',
  'Analysis: the cost of a day offline',
];

function masthead(view: ArticleView): Html {
  const mark = view.masthead;
  if (mark.kind === 'wordmark') return html`<div class="uk-wordmark">${mark.source}</div>`;
  if (mark.kind === 'svg') return html`<div class="uk-mark">${raw(mark.source)}</div>`;

  // `Number` rather than the value straight through: this lands in a style attribute, and the
  // schema is not the only way to reach here. An empty string leaves the stylesheet's height.
  const style = mark.height === undefined ? '' : `height:${Number(mark.height)}px`;

  return html`<div class="uk-mark">
    <img class="uk-supplied" src="${mark.src}" alt="${mark.alt}" style="${style}" />
  </div>`;
}

export function ukOnlineBroadsheet(view: ArticleView): Html {
  return html`
    <header class="uk-masthead">
      ${masthead(view)}
      <nav class="uk-nav">
        <span>Home</span><span>News</span><span>Business</span><span>Technology</span>
      </nav>
    </header>
    <div class="uk-shell">
      <article>
        <div class="uk-section">${view.section}</div>
        <h1 class="uk-headline">${view.headline}</h1>
        ${view.standfirst !== '' && html`<p class="uk-standfirst">${view.standfirst}</p>`}
        <div class="uk-byline">
          ${view.byline !== '' && html`<strong>${view.byline}</strong>`}
          <span>${view.timestamp}</span>
        </div>
        ${
          view.image !== undefined &&
          html`
            <figure class="uk-figure">
              <img src="${view.image.src}" alt="" />
              <figcaption class="uk-caption">
                ${view.image.caption}
                ${view.image.credit !== '' && html`<span class="uk-credit"> ${view.image.credit}</span>`}
              </figcaption>
            </figure>
          `
        }
        ${view.body.map((paragraph) => html`<p class="uk-body">${paragraph}</p>`)}
      </article>
      <aside class="uk-aside">
        <div class="uk-aside-title">More from this section</div>
        ${ASIDE_ITEMS.map((item) => html`<div class="uk-aside-item">${item}</div>`)}
      </aside>
    </div>
  `;
}
