import { readFile } from 'node:fs/promises';

import { getTypeface, typefaceFileUrl } from '../fonts/catalogue.js';
import type { TypefaceId } from '../fonts/catalogue.js';
import type { OutletTheme } from '../outlets/types.js';

/**
 * Embedding the bundled typefaces into the composed document.
 *
 * Fonts go in as `data:` URIs, never as file or network references. That is what makes the
 * document self-contained, and it is why rendering is reproducible: there is no font cache
 * to be warm or cold and no filesystem layout to get wrong.
 *
 * Every bundled face is variable across 400 to 700 in one file, so each family produces
 * exactly one `@font-face` with a weight range. The browser interpolates, which is how a
 * theme gets to ask for weight 500 and be given a real 500.
 */

/** One base64 encode per face per process. The files are 30 to 50 KB and encoding is not free. */
const cache = new Map<TypefaceId, string>();

export async function typefaceDataUri(id: TypefaceId): Promise<string> {
  const cached = cache.get(id);
  if (cached !== undefined) return cached;

  const bytes = await readFile(typefaceFileUrl(getTypeface(id)));
  const uri = `data:font/woff2;base64,${bytes.toString('base64')}`;
  cache.set(id, uri);
  return uri;
}

/** The faces a theme actually references, deduplicated: roles commonly share a family. */
export function facesUsedBy(theme: OutletTheme): { family: string; face: TypefaceId }[] {
  const seen = new Map<string, { family: string; face: TypefaceId }>();
  for (const font of Object.values(theme.fonts)) {
    seen.set(`${font.family}|${font.face}`, { family: font.family, face: font.face });
  }
  return [...seen.values()];
}

/**
 * `font-display: block` rather than `swap`: a screenshot taken during a swap would show the
 * fallback, and there is no user here whose reading a block would delay.
 */
export async function fontFaceCss(theme: OutletTheme): Promise<string> {
  const blocks = await Promise.all(
    facesUsedBy(theme).map(async ({ family, face }) => {
      const typeface = getTypeface(face);
      const uri = await typefaceDataUri(face);
      return [
        '@font-face {',
        `  font-family: '${family}';`,
        `  src: url(${uri}) format('woff2');`,
        `  font-weight: ${typeface.weights.min} ${typeface.weights.max};`,
        '  font-style: normal;',
        '  font-display: block;',
        '}',
      ].join('\n');
    }),
  );

  return blocks.join('\n');
}
