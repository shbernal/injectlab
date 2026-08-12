import type { XAuthor, XMetrics, XPostInject } from '../../spec/types.js';
import { html, raw } from '../html.js';
import type { Html } from '../html.js';
import type { PlatformTheme } from '../platforms/x.js';

/**
 * A post, or a thread of them, as one image.
 *
 * A thread is the same block repeated with a connector down the left, which is why threads
 * were worth having in the proof of concept: a rumour spreading across three posts is a much
 * more realistic inject than a single post, and it cost one CSS rule and a loop.
 */

export const X_POST_CSS = `
.x-shell {
  font-family: var(--il-font-ui);
  background: var(--il-bg);
  color: var(--il-text);
  padding: 20px 24px;
}
.x-post { display: grid; grid-template-columns: 48px 1fr; gap: 12px; }
.x-rail { display: flex; flex-direction: column; align-items: center; }
.x-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 19px;
  color: #ffffff;
  flex: none;
  overflow: hidden;
}
.x-avatar img { width: 100%; height: 100%; object-fit: cover; }
.x-connector { width: 2px; flex: 1; background: var(--il-rule); margin: 4px 0; }
.x-body { padding-bottom: 4px; min-width: 0; }
.x-head { display: flex; align-items: center; gap: 5px; font-size: 15px; line-height: 20px; }
.x-name { font-weight: 700; }
.x-badge { width: 18px; height: 18px; flex: none; }
.x-handle, .x-dot, .x-when { color: var(--il-muted); font-weight: 400; }
.x-text {
  font-size: 17px;
  line-height: 24px;
  margin-top: 2px;
  white-space: pre-wrap;
  overflow-wrap: break-word;
}
.x-metrics {
  display: flex;
  gap: 52px;
  margin-top: 14px;
  color: var(--il-muted);
  font-size: 13px;
}
.x-metric { display: flex; align-items: center; gap: 6px; }
.x-metric svg { width: 16px; height: 16px; flex: none; }
.x-gap { height: 6px; }
`.trim();

/**
 * A redrawn badge: a circle with a check inside it.
 *
 * Not the platform's mark, which is a specific scalloped shape and a trademark. This reads
 * correctly at screenshot size and is honestly a different drawing, which is the whole point.
 */
function badge(kind: Exclude<XAuthor['verified'], false | undefined>, theme: PlatformTheme): Html {
  const fill = {
    blue: theme.colors.verifiedBlue,
    gold: theme.colors.verifiedGold,
    grey: theme.colors.verifiedGrey,
  }[kind];

  return raw(
    `<svg class="x-badge" viewBox="0 0 24 24" aria-hidden="true">` +
      `<circle cx="12" cy="12" r="11" fill="${fill}"/>` +
      `<path d="M6.8 12.4l3.3 3.3 7.1-7.1" fill="none" stroke="#fff" stroke-width="2.4" ` +
      `stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  );
}

/** Simple, stable icons. Recognisable as reply, repost, like and views without being copies. */
const ICONS = {
  replies:
    '<path d="M2 4h12v8H8l-4 3v-3H2z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>',
  reposts:
    '<path d="M3 6h8l-2-2M13 10H5l2 2" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>',
  likes:
    '<path d="M8 14S2 10.5 2 6.6A3.1 3.1 0 018 4.8a3.1 3.1 0 016 1.8C14 10.5 8 14 8 14z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>',
  views:
    '<path d="M2 14V9m4 5V5m4 9V7m4 7V3" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>',
} as const;

/**
 * Compact notation, locale-aware, matching the platform's own rounding: 12.4K, 1.2M.
 *
 * A small detail that is disproportionately visible. A post showing `12400` where every real
 * one shows `12.4K` is the first thing that looks wrong.
 */
export function formatMetric(value: number, locale = 'en-GB'): string {
  const formatted = new Intl.NumberFormat(locale, {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);

  // `Intl` gives lowercase units in English and the platform shows uppercase ones. Only a
  // trailing unit letter is touched, so locales that already agree are left alone.
  return formatted.replace(/[km]$/u, (unit) => unit.toUpperCase());
}

function metrics(values: XMetrics | undefined, locale: string): Html {
  if (values === undefined) return raw('');

  const entries = (['replies', 'reposts', 'likes', 'views'] as const)
    .map((key) => [key, values[key]] as const)
    .filter((entry): entry is readonly [keyof XMetrics, number] => entry[1] !== undefined);

  if (entries.length === 0) return raw('');

  return html`<div class="x-metrics">
    ${entries.map(
      ([key, value]) => html`<div class="x-metric">
        ${raw(`<svg viewBox="0 0 16 16" aria-hidden="true">${ICONS[key]}</svg>`)}
        <span>${formatMetric(value, locale)}</span>
      </div>`,
    )}
  </div>`;
}

/**
 * A deterministic colour from the handle.
 *
 * Deterministic because rendering is: the same spec has to produce the same avatar. The
 * palette is a fixed set of readable hues rather than an arbitrary hash, so no handle ever
 * lands on white text over yellow.
 */
const AVATAR_COLORS = [
  '#1d6fb0',
  '#146b58',
  '#8a4b1f',
  '#6b3fa0',
  '#a03050',
  '#2f5f2f',
  '#8a6d1f',
  '#3b4f6b',
];

export function avatarColor(handle: string): string {
  let hash = 0;
  for (const character of handle) hash = (hash * 31 + character.codePointAt(0)!) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length] ?? '#3b4f6b';
}

/** First letters of the first two words, which is what an initials block is everywhere else. */
export function initials(name: string): string {
  return name
    .split(/\s+/u)
    .filter((word) => word !== '')
    .slice(0, 2)
    .map((word) => [...word][0]?.toUpperCase() ?? '')
    .join('');
}

function avatar(author: XAuthor, embedded: string | undefined): Html {
  return embedded === undefined
    ? html`<div class="x-avatar" style="background: ${avatarColor(author.handle)}">
        ${initials(author.name)}
      </div>`
    : html`<div class="x-avatar"><img src="${embedded}" alt="" /></div>`;
}

export interface XPostView {
  inject: XPostInject;
  theme: PlatformTheme;
  /** Already formatted by the caller, so the layout does no date work. */
  when: string;
  locale: string;
  /** Avatar as a `data:` URI, when the spec supplied one. */
  avatarSrc?: string;
}

export function xPost(view: XPostView): Html {
  const { inject, theme } = view;
  const posts = [inject.text, ...(inject.thread ?? [])];

  return html`<div class="x-shell">
    ${posts.map((text, index) => {
      const last = index === posts.length - 1;
      return html`<div class="x-post">
          <div class="x-rail">
            ${avatar(inject.author, view.avatarSrc)}
            ${!last && raw('<div class="x-connector"></div>')}
          </div>
          <div class="x-body">
            <div class="x-head">
              <span class="x-name">${inject.author.name}</span>
              ${
                inject.author.verified !== undefined &&
                inject.author.verified !== false &&
                badge(inject.author.verified, theme)
              }
              <span class="x-handle">@${inject.author.handle}</span>
              <span class="x-dot">&middot;</span>
              <span class="x-when">${view.when}</span>
            </div>
            <div class="x-text">${text}</div>
            ${last && metrics(inject.metrics, view.locale)}
          </div>
        </div>
        ${!last && raw('<div class="x-gap"></div>')}`;
    })}
  </div>`;
}
