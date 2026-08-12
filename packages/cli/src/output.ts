import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { pngSize } from '@injectlab/core';
import type { CharFinding, NewsInject } from '@injectlab/core';

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
  outlet: string;
  bytes: number;
  width?: number;
  height?: number;
}

export interface JsonReport {
  ok: boolean;
  outputs: WrittenOutput[];
  findings: (CharFinding & { spec?: string })[];
}

/** A stable, filesystem-safe name derived from the headline, so a batch does not collide. */
export function slugFor(inject: NewsInject, index: number): string {
  const slug = inject.headline
    .toLowerCase()
    .normalize('NFD')
    .replaceAll(/[̀-ͯ]/gu, '')
    .replaceAll(/[^a-z0-9]+/gu, '-')
    .replaceAll(/^-|-$/gu, '')
    .split('-')
    .slice(0, 6)
    .join('-');

  return `${String(index + 1).padStart(2, '0')}-${inject.outlet}-${slug || 'inject'}`;
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
  inject: NewsInject,
  index: number,
  total: number,
): string {
  const looksLikeFile = total === 1 && path.extname(out) !== '';
  return looksLikeFile ? out : path.join(out, `${slugFor(inject, index)}.${extension}`);
}

export async function writeOutput(
  target: string,
  data: Uint8Array | string,
  inject: NewsInject,
): Promise<WrittenOutput> {
  await mkdir(path.dirname(path.resolve(target)), { recursive: true });
  await writeFile(target, data);

  const bytes = typeof data === 'string' ? Buffer.byteLength(data) : data.length;
  return {
    path: target,
    kind: inject.kind,
    outlet: inject.outlet,
    bytes,
    ...(typeof data === 'string' ? undefined : trySize(data)),
  };
}

function trySize(png: Uint8Array): { width: number; height: number } | undefined {
  try {
    return pngSize(png);
  } catch {
    return undefined;
  }
}
