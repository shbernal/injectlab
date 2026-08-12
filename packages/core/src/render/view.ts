import { readFile } from 'node:fs/promises';
import path from 'node:path';

import type { Outlet } from '../outlets/types.js';
import type { NewsInject } from '../spec/types.js';
import { formatByline, formatTimestamp } from '../text/locale.js';

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

const IMAGE_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
};

export class ImageError extends Error {
  constructor(imagePath: string, cause: unknown) {
    super(`cannot read image ${imagePath}: ${cause instanceof Error ? cause.message : cause}`);
    this.name = 'ImageError';
  }
}

/**
 * Images are embedded, not linked, for the same reason fonts are: the document has to be
 * self-contained and the render has to make no request. A path that does not resolve is an
 * error rather than a broken image, because a broken image in an exercise asset is the kind
 * of thing nobody notices until it is in front of the exercise cell.
 */
async function embedImage(imagePath: string, baseDir: string | undefined): Promise<string> {
  const resolved = baseDir === undefined ? imagePath : path.resolve(baseDir, imagePath);
  const type = IMAGE_TYPES[path.extname(resolved).toLowerCase()];

  if (type === undefined) {
    throw new ImageError(
      imagePath,
      `unsupported extension, expected one of ${Object.keys(IMAGE_TYPES).join(', ')}`,
    );
  }

  try {
    const bytes = await readFile(resolved);
    return `data:${type};base64,${bytes.toString('base64')}`;
  } catch (error) {
    throw new ImageError(imagePath, error);
  }
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
