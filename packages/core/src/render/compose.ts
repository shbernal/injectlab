import { getOutlet } from '../outlets/registry.js';
import type { LayoutFamily, Outlet } from '../outlets/types.js';
import type { NewsInject } from '../spec/types.js';
import { RESET, themeVariables } from './css.js';
import { DEFAULT_DISCLAIMER, DISCLAIMER_CSS, disclaimerBand } from './disclaimer.js';
import { fontFaceCss } from './fonts.js';
import { html, raw, toHtmlString } from './html.js';
import type { Html } from './html.js';
import { FR_ONLINE_DAILY_CSS, frOnlineDaily } from './layouts/fr-online-daily.js';
import { UK_ONLINE_BROADSHEET_CSS, ukOnlineBroadsheet } from './layouts/uk-online-broadsheet.js';
import { buildView } from './view.js';
import type { ViewContext } from './view.js';

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

const LAYOUTS: Record<
  LayoutFamily,
  { css: string; render: (view: Parameters<typeof ukOnlineBroadsheet>[0]) => Html }
> = {
  'uk-online-broadsheet': { css: UK_ONLINE_BROADSHEET_CSS, render: ukOnlineBroadsheet },
  'fr-online-daily': { css: FR_ONLINE_DAILY_CSS, render: frOnlineDaily },
};

export interface ComposeOptions extends ViewContext {
  /** Banner text, or `NO_DISCLAIMER` to omit the bands. */
  disclaimer?: string;
}

export async function buildDocument(
  inject: NewsInject,
  options: ComposeOptions = {},
): Promise<string> {
  const outlet = getOutlet(inject.outlet);
  return toHtmlString(await composeDocument(inject, outlet, options));
}

async function composeDocument(
  inject: NewsInject,
  outlet: Outlet,
  options: ComposeOptions,
): Promise<Html> {
  const layout = LAYOUTS[outlet.layout];
  const disclaimer = options.disclaimer ?? DEFAULT_DISCLAIMER;
  const view = await buildView(inject, outlet, options);

  const styles = [
    await fontFaceCss(outlet.theme),
    themeVariables(outlet.theme),
    RESET,
    DISCLAIMER_CSS,
    layout.css,
  ].join('\n\n');

  // The `lang` attribute is the outlet's, not the host's. It drives hyphenation and quote
  // rendering, and a French article marked `en` is subtly wrong in a way nobody can name.
  return html`<!doctype html>
    <html lang="${outlet.locale}">
      <head>
        <meta charset="utf-8" />
        <title>${view.headline}</title>
        <style>
          ${raw(styles)}
        </style>
      </head>
      <body>
        ${disclaimerBand(disclaimer, 'top')} ${layout.render(view)}
        ${disclaimerBand(disclaimer, 'bottom')}
      </body>
    </html> `;
}
