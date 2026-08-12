import { getTypeface } from '../fonts/catalogue.js';
import { getOutlet } from '../outlets/registry.js';
import type { LayoutFamily, Outlet } from '../outlets/types.js';
import type { InjectSpec, NewsInject, XPostInject } from '../spec/types.js';
import { formatTime } from '../text/locale.js';
import { RESET, themeVariables } from './css.js';
import { DEFAULT_DISCLAIMER, DISCLAIMER_CSS, disclaimerBand } from './disclaimer.js';
import { fontFaceCss, typefaceDataUri } from './fonts.js';
import { html, raw, toHtmlString } from './html.js';
import type { Html } from './html.js';
import { FR_ONLINE_DAILY_CSS, frOnlineDaily } from './layouts/fr-online-daily.js';
import { UK_ONLINE_BROADSHEET_CSS, ukOnlineBroadsheet } from './layouts/uk-online-broadsheet.js';
import { X_POST_CSS, xPost } from './layouts/x-post.js';
import { xTheme } from './platforms/x.js';
import type { PlatformTheme } from './platforms/x.js';
import { embedImage } from './image.js';
import { buildView } from './view.js';
import type { ArticleView, ViewContext } from './view.js';

/**
 * Composing one self-contained HTML document.
 *
 * Self-contained is the whole requirement: inline style, `data:` URI fonts and images, no
 * external reference of any kind. Proven by rendering with every request routed to abort and
 * observing that the page issues none.
 *
 * Deterministic too. The same inject at the same version produces the same string, byte for
 * byte. Nothing here reads a clock, a locale default or an environment variable.
 */

const LAYOUTS: Record<LayoutFamily, { css: string; render: (view: ArticleView) => Html }> = {
  'uk-online-broadsheet': { css: UK_ONLINE_BROADSHEET_CSS, render: ukOnlineBroadsheet },
  'fr-online-daily': { css: FR_ONLINE_DAILY_CSS, render: frOnlineDaily },
};

export interface ComposeOptions extends ViewContext {
  /** Banner text, or `NO_DISCLAIMER` to omit the bands. */
  disclaimer?: string;
}

export async function buildDocument(
  inject: InjectSpec,
  options: ComposeOptions = {},
): Promise<string> {
  const body =
    inject.kind === 'news'
      ? await composeNews(inject, options)
      : await composeXPost(inject, options);
  return toHtmlString(body);
}

async function composeNews(inject: NewsInject, options: ComposeOptions): Promise<Html> {
  const outlet: Outlet = getOutlet(inject.outlet);
  const layout = LAYOUTS[outlet.layout];
  const view = await buildView(inject, outlet, options);

  return page({
    lang: outlet.locale,
    title: inject.headline,
    styles: [
      await fontFaceCss(outlet.theme),
      themeVariables(outlet.theme),
      RESET,
      DISCLAIMER_CSS,
      layout.css,
    ],
    disclaimer: options.disclaimer ?? DEFAULT_DISCLAIMER,
    content: layout.render(view),
  });
}

/**
 * The X path shares the page shell, the disclaimer and the font embedding, and nothing else.
 * It never touches the outlet registry, which is the point: a platform is not a publication.
 */
async function composeXPost(inject: XPostInject, options: ComposeOptions): Promise<Html> {
  const theme: PlatformTheme = xTheme(inject.theme);
  const locale = 'en-GB';

  const avatarSrc =
    inject.author.avatar === undefined
      ? undefined
      : await embedImage(inject.author.avatar, options.baseDir);

  return page({
    lang: 'en',
    title: `${inject.author.name} on ${theme.name}`,
    styles: [await platformFontCss(), platformVariables(theme), RESET, DISCLAIMER_CSS, X_POST_CSS],
    disclaimer: options.disclaimer ?? DEFAULT_DISCLAIMER,
    content: xPost({
      inject,
      theme,
      locale,
      when: formatXTime(inject.postedAt, locale),
      ...(avatarSrc === undefined ? {} : { avatarSrc }),
    }),
  });
}

/** The platform sets its text in one face, so this is not the outlet theme's font block. */
async function platformFontCss(): Promise<string> {
  const typeface = getTypeface('inter');
  const uri = await typefaceDataUri('inter');

  return [
    '@font-face {',
    "  font-family: 'X Interface Stand-in';",
    `  src: url(${uri}) format('woff2');`,
    `  font-weight: ${typeface.weights.min} ${typeface.weights.max};`,
    '  font-style: normal;',
    '  font-display: block;',
    '}',
  ].join('\n');
}

function platformVariables(theme: PlatformTheme): string {
  const variables: Record<string, string> = {
    '--il-font-headline': "'X Interface Stand-in', system-ui, sans-serif",
    '--il-font-body': "'X Interface Stand-in', system-ui, sans-serif",
    '--il-font-ui': "'X Interface Stand-in', system-ui, sans-serif",
    '--il-text': theme.colors.text,
    '--il-muted': theme.colors.muted,
    '--il-accent': theme.colors.accent,
    '--il-rule': theme.colors.rule,
    '--il-bg': theme.colors.background,
    '--il-section': theme.colors.accent,
    '--il-headline-size': '17px',
    '--il-headline-weight': '700',
    '--il-headline-leading': '1.4',
    '--il-measure': '598px',
  };

  return `:root {\n${Object.entries(variables)
    .map(([name, value]) => `  ${name}: ${value};`)
    .join('\n')}\n}`;
}

/** Posts show a wall-clock time, not a long date. UTC when the offset says so. */
function formatXTime(instant: string, locale: string): string {
  return formatTime(instant, {
    locale,
    timeZone: 'UTC',
  });
}

interface Page {
  lang: string;
  title: string;
  styles: readonly string[];
  disclaimer: string;
  content: Html;
}

function page({ lang, title, styles, disclaimer, content }: Page): Html {
  // The `lang` attribute is the source's, not the host's. It drives hyphenation and quote
  // rendering, and a French article marked `en` is subtly wrong in a way nobody can name.
  return html`<!doctype html>
    <html lang="${lang}">
      <head>
        <meta charset="utf-8" />
        <title>${title}</title>
        <style>
          ${raw(styles.join('\n\n'))}
        </style>
      </head>
      <body>
        ${disclaimerBand(disclaimer, 'top')} ${content} ${disclaimerBand(disclaimer, 'bottom')}
      </body>
    </html> `;
}
