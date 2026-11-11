import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { pngSize, sourceOf } from '@injectlab/core';
import type { CharFinding, InjectSpec } from '@injectlab/core';

/**
 * Where results go and how they are reported.
 *
 * Diagnostics go to stderr without exception, so stdout stays parseable whether or not
 * `--json` was asked for. An agent that has to strip a progress line out of a JSON document
 * is an agent that will eventually strip the wrong one.
 */

export interface WrittenOutput {
  path: string;
  kind: string;
  /** Outlet id for news, platform id for a post. */
  source: string;
  bytes: number;
  width?: number;
  height?: number;
}

export interface JsonReport {
  ok: boolean;
  outputs: WrittenOutput[];
  findings: (CharFinding & { spec?: string })[];
}

/**
 * A stable, filesystem-safe name for one result.
 *
 * Derived from whatever that kind's headline text is, so a batch of twenty does not collide
 * and the directory listing is readable without opening anything.
 */
export function slugFor(inject: InjectSpec, index: number): string {
  const title = inject.kind === 'news' ? inject.headline : `${inject.author.handle} ${inject.text}`;

  const slug = title
    .toLowerCase()
    .normalize('NFD')
    .replaceAll(/[̀-ͯ]/gu, '')
    .replaceAll(/[^a-z0-9]+/gu, '-')
    .replaceAll(/^-|-$/gu, '')
    .split('-')
    .slice(0, 6)
    .join('-');

  return `${String(index + 1).padStart(2, '0')}-${sourceOf(inject)}-${slug || 'inject'}`;
}

/**
 * Resolves where one result is written.
 *
 * `--out` is a file when there is exactly one result and it carries an extension, and a
 * directory otherwise. Guessing this is worth it: typing `--out report.png` and getting
 * `report.png/01-bbc-....png` would be surprising.
 */
export function resolveOutPath(
  out: string,
  extension: string,
  inject: InjectSpec,
  index: number,
  total: number,
): string {
  const looksLikeFile = total === 1 && path.extname(out) !== '';
  return looksLikeFile ? out : path.join(out, `${slugFor(inject, index)}.${extension}`);
}

export async function writeOutput(
  target: string,
  data: Uint8Array | string,
  inject: InjectSpec,
): Promise<WrittenOutput> {
  await mkdir(path.dirname(path.resolve(target)), { recursive: true });
  await writeFile(target, data);

  const bytes = typeof data === 'string' ? Buffer.byteLength(data) : data.length;
  return {
    path: target,
    kind: inject.kind,
    source: sourceOf(inject),
    bytes,
    ...(typeof data === 'string' ? undefined : pngSize(data)),
  };
}
