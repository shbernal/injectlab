/**
 * Populate `packages/core/assets/fonts/` from Google Fonts.
 *
 * Dev-only and run by hand. The output is committed, because rendering must work with no
 * network and no system font cache, and because a font that is fetched at build time is a
 * font that will one day fail to be fetched.
 *
 * Every family here is under the SIL Open Font License, and its `OFL.txt` is downloaded
 * alongside the binary. A family whose licence cannot be fetched is not written at all: an
 * unlicensed font file in the tree is worse than a missing one.
 *
 * Run: node tools/fetch-fonts.mjs
 */

import { mkdir, writeFile } from 'node:fs/promises';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

const OUT = new URL('../packages/core/assets/fonts/', import.meta.url);

/**
 * `slug` is the directory name in the google/fonts repository, which is the family name
 * lowercased with the spaces removed.
 */
const FAMILIES = [
  { id: 'inter', family: 'Inter', slug: 'inter' },
  { id: 'libre-franklin', family: 'Libre Franklin', slug: 'librefranklin' },
  { id: 'lora', family: 'Lora', slug: 'lora' },
  { id: 'source-serif-4', family: 'Source Serif 4', slug: 'sourceserif4' },
  { id: 'noto-sans', family: 'Noto Sans', slug: 'notosans' },
  { id: 'noto-serif', family: 'Noto Serif', slug: 'notoserif' },
];

const MIN = 400;
const MAX = 700;

async function css(query) {
  const response = await fetch(`https://fonts.googleapis.com/css2?${query}&display=block`, {
    headers: { 'user-agent': UA },
  });
  return response.ok ? await response.text() : null;
}

/** The latin subset block is the one covering U+0000. The others are Cyrillic, Greek, and so on. */
function latinFace(text) {
  for (const block of text.split('@font-face').slice(1)) {
    if (!block.includes('U+0000-00FF')) continue;
    const url = /url\((https:[^)]+\.woff2)\)/.exec(block)?.[1];
    const weight = /font-weight: ([\d ]+);/.exec(block)?.[1];
    if (url && weight) return { url, weight: weight.trim() };
  }
  return null;
}

await mkdir(OUT, { recursive: true });

const manifest = [];

for (const { id, family, slug } of FAMILIES) {
  const name = family.replaceAll(' ', '+');

  // The variable syntax is only served for families that actually have a weight axis, so a
  // null here is the answer to "is this variable", not an error.
  const variable = await css(`family=${name}:wght@${MIN}..${MAX}`);
  const text = variable ?? (await css(`family=${name}:wght@${MIN};${MAX}`));
  if (!text) throw new Error(`${family}: no CSS from the API`);

  const face = latinFace(text);
  if (!face) throw new Error(`${family}: no latin subset in the CSS`);

  const licence = await fetch(
    `https://raw.githubusercontent.com/google/fonts/main/ofl/${slug}/OFL.txt`,
  );
  if (!licence.ok) throw new Error(`${family}: no OFL.txt at ofl/${slug}, refusing to write it`);
  const licenceText = await licence.text();

  const bytes = new Uint8Array(await (await fetch(face.url)).arrayBuffer());
  const file = `${id}.woff2`;

  await writeFile(new URL(file, OUT), bytes);
  await writeFile(new URL(`${id}.OFL.txt`, OUT), licenceText);

  const copyright = /^Copyright.*$/m.exec(licenceText)?.[0] ?? '';
  const isVariable = face.weight.includes(' ');

  manifest.push({
    id,
    family,
    file,
    weight: face.weight,
    isVariable,
    copyright,
    bytes: bytes.length,
  });
  console.log(`${file.padEnd(22)} ${String(bytes.length).padStart(7)} B  weight ${face.weight}`);
}

console.log('');
console.log(JSON.stringify(manifest, null, 2));
