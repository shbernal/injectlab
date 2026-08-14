import { html, raw } from '../html.js';
import type { Html } from '../html.js';
import type { ArticleView } from '../view.js';

/**
 * The French online daily: centred masthead over a rule, a kicker above a serif headline,
 * a chapeau, then the story column with the byline below the standfirst rather than above the
 * image, and a subscriber marker in the furniture.
 *
 * Deliberately a different arrangement from the UK family rather than the same one in
 * different colours. Two families that differ only by theme values would prove nothing about
 * whether the theme model is doing any work.
 *
 * The page is three stacked bands rather than one column, because the second outlet in this
 * family does not run one column. Le Monde sets its headline at the body measure and hard
 * left; Les Echos centres a 1000px headline over a 636px column. Both are `theme.hero`, so
 * the family holds. Where the two measures are equal the three bands land exactly where the
 * single column did.
 *
 * The caption is the exception to the hero's alignment, which is why it sits in its own band
 * rather than inside the centred one: both outlets set the caption left under a lead image
 * however the headline above it is set.
 */

export const FR_ONLINE_DAILY_CSS = `
.fr-masthead {
  text-align: center;
  padding: 22px 40px 14px;
  border-bottom: 2px solid var(--il-text);
}
.fr-wordmark {
  font-family: var(--il-font-headline);
  font-weight: 700;
  font-size: 40px;
  letter-spacing: 0.02em;
  color: var(--il-text);
}
/* Centred like the wordmark it replaces, at roughly its cap height. */
.fr-supplied { display: block; margin: 0 auto; height: 46px; width: auto; }
.fr-nav {
  font-family: var(--il-font-ui);
  font-size: 13px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--il-muted);
  display: flex;
  justify-content: center;
  gap: 26px;
  padding: 12px 0 2px;
}
.fr-hero {
  max-width: var(--il-hero-measure);
  margin: 0 auto;
  padding: 34px 28px 0;
  text-align: var(--il-hero-align);
}
.fr-lead {
  max-width: var(--il-hero-measure);
  margin: 0 auto;
  padding: 0 28px;
}
.fr-shell {
  max-width: var(--il-measure);
  margin: 0 auto;
  padding: 0 28px 64px;
}
.fr-kicker {
  font-family: var(--il-font-ui);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--il-section);
  margin-bottom: 14px;
}
.fr-headline {
  font-family: var(--il-font-headline);
  font-size: var(--il-headline-size);
  font-weight: var(--il-headline-weight);
  line-height: var(--il-headline-leading);
  margin-bottom: 18px;
}
/* The headline face, not the body one. Both French outlets set the chapeau with the headline
   rather than with the story, and for Le Monde the two faces are the same file anyway. */
.fr-chapeau {
  font-family: var(--il-font-headline);
  font-size: 20px;
  line-height: 1.45;
  color: var(--il-muted);
  margin-bottom: 20px;
}
.fr-byline {
  font-family: var(--il-font-ui);
  font-size: 14px;
  color: var(--il-muted);
  border-top: 1px solid var(--il-rule);
  padding-top: 12px;
  margin-bottom: 26px;
  display: flex;
  justify-content: space-between;
  gap: 16px;
}
.fr-byline strong { color: var(--il-text); font-weight: 700; }
.fr-tag {
  font-family: var(--il-font-ui);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--il-on-accent);
  background: var(--il-accent);
  padding: 3px 7px;
  align-self: flex-start;
}
.fr-figure { margin-bottom: 26px; }
.fr-caption {
  font-family: var(--il-font-ui);
  font-size: 12px;
  color: var(--il-muted);
  padding-top: 8px;
  line-height: 1.4;
}
.fr-body { font-size: 18px; line-height: 1.7; margin-bottom: 20px; }
`.trim();

function masthead(view: ArticleView): Html {
  const mark = view.masthead;
  if (mark.kind === 'wordmark') return html`<div class="fr-wordmark">${mark.source}</div>`;
  if (mark.kind === 'svg') return raw(mark.source);

  // See the note in the UK family: `Number` because this reaches a style attribute.
  const style = mark.height === undefined ? '' : `height:${Number(mark.height)}px`;

  return html`<img class="fr-supplied" src="${mark.src}" alt="${mark.alt}" style="${style}" />`;
}

export function frOnlineDaily(view: ArticleView): Html {
  return html`
    <header class="fr-masthead">
      ${masthead(view)}
      <nav class="fr-nav">${view.navSections.map((section) => html`<span>${section}</span>`)}</nav>
    </header>
    <article>
      <div class="fr-hero">
        <div class="fr-kicker">${view.section}</div>
        <h1 class="fr-headline">${view.headline}</h1>
        ${view.standfirst !== '' && html`<p class="fr-chapeau">${view.standfirst}</p>`}
      </div>
      ${
        view.image !== undefined &&
        html`
          <div class="fr-lead">
            <figure class="fr-figure">
              <img src="${view.image.src}" alt="" />
              <figcaption class="fr-caption">
                ${view.image.caption}${view.image.credit !== '' && html` ${view.image.credit}`}
              </figcaption>
            </figure>
          </div>
        `
      }
      <div class="fr-shell">
        <div class="fr-byline">
          <div>
            ${view.byline !== '' && html`<strong>${view.byline}</strong>`}
            ${view.byline !== '' && raw(' ')}${view.timestamp}
          </div>
          <div class="fr-tag">Article réservé aux abonnés</div>
        </div>
        ${view.body.map((paragraph) => html`<p class="fr-body">${paragraph}</p>`)}
      </div>
    </article>
  `;
}
