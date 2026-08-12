/**
 * The bundled typefaces.
 *
 * Every outlet theme names a face from this catalogue. Nothing else is allowed: outlets use
 * licensed typefaces that cannot be shipped, so what injectlab ships is a set of
 * open-licensed faces chosen for visual proximity, and each outlet says in its `fidelity`
 * note what it is approximating.
 *
 * All six are variable fonts covering 400 to 700 in a single file, which is why there is one
 * file per family rather than one per weight. Declaring the range on the `@font-face` gives
 * real interpolation, including weights no static file would provide.
 *
 * Files and licences are fetched by `tools/fetch-fonts.mjs` and committed. Rendering must
 * work with no network and no system font cache, so a font resolved at build time would be a
 * font that one day fails to resolve.
 */

export interface Typeface {
  id: string;
  /** The family name as its authors write it. */
  name: string;
  /** File name inside the bundled font directory. */
  file: string;
  /** Inclusive weight range the variable axis covers. */
  weights: { min: number; max: number };
  licence: {
    /** SPDX identifier. Everything bundled is under the SIL Open Font License. */
    id: 'OFL-1.1';
    /** The licence text shipped beside the binary. */
    file: string;
    copyright: string;
  };
  /** Why this face is in the bundle, in the terms an outlet author needs. */
  standsInFor: string;
}

const CATALOGUE = {
  inter: {
    id: 'inter',
    name: 'Inter',
    file: 'inter.woff2',
    weights: { min: 400, max: 700 },
    licence: {
      id: 'OFL-1.1',
      file: 'inter.OFL.txt',
      copyright: 'Copyright 2020 The Inter Project Authors (https://github.com/rsms/inter)',
    },
    standsInFor: 'Neutral interface grotesques. Navigation, section tags and timestamps.',
  },
  'libre-franklin': {
    id: 'libre-franklin',
    name: 'Libre Franklin',
    file: 'libre-franklin.woff2',
    weights: { min: 400, max: 700 },
    licence: {
      id: 'OFL-1.1',
      file: 'libre-franklin.OFL.txt',
      copyright:
        'Copyright 2020 The Libre Franklin Project Authors (https://github.com/googlefonts/Libre-Franklin)',
    },
    standsInFor:
      'Editorial grotesques with a Franklin Gothic ancestry. Closest bundled face to BBC Reith Sans.',
  },
  lora: {
    id: 'lora',
    name: 'Lora',
    file: 'lora.woff2',
    weights: { min: 400, max: 700 },
    licence: {
      id: 'OFL-1.1',
      file: 'lora.OFL.txt',
      copyright:
        'Copyright 2011 The Lora Project Authors (https://github.com/cyrealtype/Lora-Cyrillic), with Reserved Font Name "Lora".',
    },
    standsInFor:
      'Contemporary text serifs with brushed contrast. Reads as a modern news serif at headline sizes.',
  },
  'source-serif-4': {
    id: 'source-serif-4',
    name: 'Source Serif 4',
    file: 'source-serif-4.woff2',
    weights: { min: 400, max: 700 },
    licence: {
      id: 'OFL-1.1',
      file: 'source-serif-4.OFL.txt',
      copyright:
        'Copyright 2014 The Source Serif 4 Project Authors (https://github.com/adobe-fonts/source-serif)',
    },
    standsInFor:
      'Transitional serifs in the Fenway and Cheltenham territory. The French and US broadsheet look.',
  },
  'noto-sans': {
    id: 'noto-sans',
    name: 'Noto Sans',
    file: 'noto-sans.woff2',
    weights: { min: 400, max: 700 },
    licence: {
      id: 'OFL-1.1',
      file: 'noto-sans.OFL.txt',
      copyright:
        'Copyright 2022 The Noto Project Authors (https://github.com/notofonts/latin-greek-cyrillic)',
    },
    standsInFor: 'Generic sans fallback for outlets with no distinctive grotesque.',
  },
  'noto-serif': {
    id: 'noto-serif',
    name: 'Noto Serif',
    file: 'noto-serif.woff2',
    weights: { min: 400, max: 700 },
    licence: {
      id: 'OFL-1.1',
      file: 'noto-serif.OFL.txt',
      copyright:
        'Copyright 2022 The Noto Project Authors (https://github.com/notofonts/latin-greek-cyrillic)',
    },
    standsInFor: 'Generic serif fallback for outlets with no distinctive text face.',
  },
} as const satisfies Record<string, Typeface>;

export type TypefaceId = keyof typeof CATALOGUE;

export function listTypefaces(): readonly Typeface[] {
  return Object.values(CATALOGUE);
}

export function getTypeface(id: TypefaceId): Typeface {
  return CATALOGUE[id];
}

export function isTypefaceId(value: string): value is TypefaceId {
  return Object.hasOwn(CATALOGUE, value);
}

/**
 * Where the bundled files live.
 *
 * `src/fonts/` and `dist/fonts/` are both two levels under the package root, so this
 * resolves the same whether it runs from source in a test or from the built package.
 */
export const FONT_ASSET_DIR = new URL('../../assets/fonts/', import.meta.url);

export function typefaceFileUrl(typeface: Typeface): URL {
  return new URL(typeface.file, FONT_ASSET_DIR);
}

export function typefaceLicenceUrl(typeface: Typeface): URL {
  return new URL(typeface.licence.file, FONT_ASSET_DIR);
}
