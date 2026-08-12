import type { Outlet } from '../outlets/types.js';
import type { NewsInject } from '../spec/types.js';
import { formatByline, formatTimestamp } from '../text/locale.js';
import { embedImage } from './image.js';

/**
 * Everything a layout needs, already resolved.
 *
 * Layouts receive strings, not a spec and an outlet. Date conventions, byline prefixes,
 * section defaults and URL synthesis are outlet policy and belong here, applied once, rather
 * than repeated in every layout with a chance of diverging.
 */

export interface ArticleView {
  outletName: string;
  masthead: Outlet['theme']['masthead'];
  section: string;
  headline: string;
  standfirst: string;
  byline: string;
  timestamp: string;
  body: readonly string[];
  /** Displayed in an address bar where the layout has one. Never fetched. */
  url: string;
  image?: { src: string; caption: string; credit: string };
}

export interface ViewContext {
  /** Directory a relative `image.path` is resolved against, normally the spec file's own. */
  baseDir?: string;
}

/** A plausible article URL, so a layout with an address bar has something to show. */
function synthesiseUrl(inject: NewsInject, outlet: Outlet): string {
  const slug = inject.headline
    .toLowerCase()
    .normalize('NFD')
    .replaceAll(/[̀-ͯ]/gu, '')
    .replaceAll(/[^a-z0-9]+/gu, '-')
    .replaceAll(/^-|-$/gu, '')
    .split('-')
    .slice(0, 8)
    .join('-');

  return `https://www.${outlet.domain}/${slug}`;
}

export async function buildView(
  inject: NewsInject,
  outlet: Outlet,
  context: ViewContext = {},
): Promise<ArticleView> {
  const image = inject.image;

  return {
    outletName: outlet.name,
    masthead: outlet.theme.masthead,
    section: inject.section ?? outlet.conventions.sectionDefault,
    headline: inject.headline,
    standfirst: inject.standfirst ?? '',
    byline: formatByline(inject.byline, outlet),
    timestamp: formatTimestamp(inject.publishedAt, outlet),
    body: inject.body ?? [],
    url: inject.url ?? synthesiseUrl(inject, outlet),
    ...(image === undefined
      ? {}
      : {
          image: {
            src: await embedImage(image.path, context.baseDir),
            caption: image.caption ?? '',
            credit: image.credit ?? '',
          },
        }),
  };
}
