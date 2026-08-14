import type { Outlet } from '../outlets/types.js';
import type { InjectMasthead, NewsInject } from '../spec/types.js';
import { formatByline, formatTimestamp } from '../text/locale.js';
import { embedImage } from './image.js';

/**
 * Everything a layout needs, already resolved.
 *
 * Layouts receive strings, not a spec and an outlet. Date conventions, byline prefixes,
 * section defaults and URL synthesis are outlet policy and belong here, applied once, rather
 * than repeated in every layout with a chance of diverging.
 */

/**
 * The masthead a layout draws: the outlet's own two kinds, plus a third the outlet registry
 * cannot produce, because a supplied mark comes from the spec rather than from the theme.
 *
 * Resolved to a `data:` URI before it reaches a layout, like every other image, so a layout
 * never learns whether the bytes came off disk or off a network.
 */
export type MastheadView =
  | Outlet['theme']['masthead']
  | { kind: 'image'; src: string; alt: string; height?: number };

export interface ArticleView {
  outletName: string;
  masthead: MastheadView;
  /** The section row the layout draws across the top. Furniture, never the story's section. */
  navSections: readonly string[];
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
  /**
   * Remote URLs the spec named, already fetched by the caller, keyed by the URL itself.
   *
   * The composer does not fetch. `prefetchRemoteAssets` in `remote.ts` produces this, the CLI
   * calls it when `--allow-remote` is set, and a spec naming a URL that is absent from this
   * map is an error rather than a silent request.
   */
  remoteAssets?: ReadonlyMap<string, string>;
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

/**
 * A spec named a masthead by URL and the caller did not resolve it first.
 *
 * Deliberately declared here and not in `remote.ts`, so that nothing on the composing path
 * imports the module that can `fetch`. The composer's complaint is also genuinely a different
 * one: not "remote fetching is forbidden", which is the CLI's policy to state, but "you handed
 * me a reference I have no way to resolve, and resolving it is not my job".
 */
export class UnresolvedMastheadError extends Error {
  readonly url: string;

  constructor(url: string) {
    super(
      `masthead ${url} was not resolved before composing. ` +
        'Fetch it with prefetchRemoteAssets and pass the result as remoteAssets, ' +
        'or run the CLI with --allow-remote.',
    );
    this.name = 'UnresolvedMastheadError';
    this.url = url;
  }
}

/**
 * The outlet's masthead unless the spec supplied one.
 *
 * The alt text is the outlet name rather than anything the spec chose. A supplied mark is
 * still standing in for that outlet in the composed document, and letting a spec write
 * arbitrary text into the header was a field nobody asked for.
 */
async function resolveMasthead(
  supplied: InjectMasthead | undefined,
  outlet: Outlet,
  context: ViewContext,
): Promise<MastheadView> {
  if (supplied === undefined) return outlet.theme.masthead;

  const src =
    supplied.path === undefined
      ? context.remoteAssets?.get(supplied.url ?? '')
      : await embedImage(supplied.path, context.baseDir);

  // Only reachable when a URL was given and the caller did not prefetch it, which is the
  // composer being asked to do the one thing it does not do.
  if (src === undefined) throw new UnresolvedMastheadError(supplied.url ?? '');

  return {
    kind: 'image',
    src,
    alt: outlet.name,
    ...(supplied.height === undefined ? {} : { height: supplied.height }),
  };
}

export async function buildView(
  inject: NewsInject,
  outlet: Outlet,
  context: ViewContext = {},
): Promise<ArticleView> {
  const image = inject.image;

  return {
    outletName: outlet.name,
    masthead: await resolveMasthead(inject.masthead, outlet, context),
    navSections: outlet.conventions.navSections,
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
