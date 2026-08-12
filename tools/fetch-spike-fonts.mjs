/**
 * Scratch: pull the latin subset of a few open-licensed faces into `.references/fonts/`
 * so the render spike has real WOFF2 bytes to inline. `.references/` is git-ignored.
 *
 * Throwaway. Font sourcing proper is an outlet-authoring concern and gets a real tool.
 */

import { mkdir, writeFile } from 'node:fs/promises';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

const FAMILIES = 'family=Libre+Franklin:wght@400;700&family=Lora:wght@400;700';
const OUT = new URL('../.references/fonts/', import.meta.url);

const css = await (
  await fetch(`https://fonts.googleapis.com/css2?${FAMILIES}&display=swap`, {
    headers: { 'user-agent': UA },
  })
).text();

/** Each @font-face block, keeping only the latin subset (the one covering U+0000). */
const faces = css
  .split('@font-face')
  .slice(1)
  .map((block) => ({
    family: /font-family: '([^']+)'/.exec(block)?.[1],
    weight: /font-weight: (\d+)/.exec(block)?.[1],
    url: /url\((https:[^)]+\.woff2)\)/.exec(block)?.[1],
    latin: block.includes('U+0000-00FF'),
  }))
  .filter((f) => f.latin && f.family && f.weight && f.url);

await mkdir(OUT, { recursive: true });

for (const face of faces) {
  const slug = `${face.family.toLowerCase().replaceAll(' ', '-')}-${face.weight}.woff2`;
  const bytes = new Uint8Array(await (await fetch(face.url)).arrayBuffer());
  await writeFile(new URL(slug, OUT), bytes);
  console.log(`${slug}  ${bytes.length} bytes`);
}
