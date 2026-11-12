import { readFile } from 'node:fs/promises';

import { gate } from '../text/chars.js';
import type { CharFinding } from '../text/chars.js';
import type { CharPolicy, InjectSpec, InjectVariant } from '../spec/types.js';
import { buildDocument } from './compose.js';
import type { ComposeOptions } from './compose.js';
import { X_PLATFORM } from './platforms/x.js';
import { addProvenance } from './provenance.js';
import type { Renderer, RenderTarget } from './renderer.js';

/**
 * Spec in, PNG out.
 *
 * The order matters. The character gate runs before the browser is touched, so a bad dash in
 * a headline is reported in milliseconds rather than after a Chromium launch. Provenance is
 * added after the screenshot and is not conditional on anything.
 */

/**
 * Viewport presets by variant.
 *
 * The plan had these defined per outlet, so "mobile" would mean what that outlet's mobile
 * site means. Left shared until an outlet actually needs different numbers: an unused
 * per-outlet field is a field that gets filled in wrongly by copy and paste.
 *
 * `card` has an explicit height because it is the social preview shape, where the crop is
 * the point. The others are full-page.
 */
const VARIANTS: Record<InjectVariant, Omit<RenderTarget, 'scale' | 'format'>> = {
  desktop: { width: 1200 },
  mobile: { width: 390 },
  card: { width: 1200, height: 630 },
};

export function targetFor(variant: InjectVariant = 'desktop', scale: 1 | 2 | 3 = 2): RenderTarget {
  return { ...VARIANTS[variant], scale, format: 'png' };
}

/**
 * What produced this inject: an outlet id for news, a platform id for a post.
 *
 * One field rather than two, because provenance is read by whoever finds a stray PNG and
 * they do not care which of our internal registries the value came out of. It is also why
 * the chunk is called `injectlab.source` and not `injectlab.outlet`: naming it after outlets
 * would have been the same conflation the X kind exists to avoid.
 */
export function sourceOf(inject: InjectSpec): string {
  return inject.kind === 'news' ? inject.outlet : X_PLATFORM.id;
}

/**
 * The target an inject wants when the caller has not dictated one.
 *
 * Posts are drawn at a fixed card width, because a post is a card and not a page. Articles
 * are drawn at their variant's viewport. This is why a caller should pass `scale` rather than
 * a whole `target` unless it genuinely means to override the width: passing an article
 * viewport for a post produces a correct post floating in a page of empty space.
 */
function targetOf(inject: InjectSpec, scale: 1 | 2 | 3 = 2): RenderTarget {
  return inject.kind === 'news'
    ? targetFor(inject.variant, scale)
    : { width: 640, scale, format: 'png' };
}

let cachedVersion: string | undefined;

/** Read rather than hardcoded, so the provenance cannot claim a version that is not shipping. */
async function packageVersion(): Promise<string> {
  if (cachedVersion === undefined) {
    const manifest: unknown = JSON.parse(
      await readFile(new URL('../../package.json', import.meta.url), 'utf8'),
    );
    if (
      typeof manifest !== 'object' ||
      manifest === null ||
      !('version' in manifest) ||
      typeof manifest.version !== 'string'
    ) {
      throw new Error('@injectlab/core: package.json has no version');
    }
    cachedVersion = manifest.version;
  }
  return cachedVersion;
}

export interface RenderInjectOptions extends ComposeOptions {
  renderer: Renderer;
  /** Overrides the width as well. Prefer `scale` unless the width is meant to change. */
  target?: RenderTarget;
  /** Applied to whatever target the inject asks for. Default 2. */
  scale?: 1 | 2 | 3;
  /** Defaults to `error`, which rejects rather than rendering banned characters. */
  chars?: CharPolicy;
  /** Spec file basename, recorded in the PNG. */
  generatedFrom?: string;
}

export interface RenderResult {
  png: Uint8Array;
  /** Non-empty only under the `warn` policy, where the caller is expected to print them. */
  findings: readonly CharFinding[];
}

export async function renderInject(
  inject: InjectSpec,
  options: RenderInjectOptions,
): Promise<RenderResult> {
  const { findings } = await gate(
    inject,
    options.chars ?? 'error',
    options.disclaimer === undefined ? undefined : { disclaimer: options.disclaimer },
  );

  const document = await buildDocument(inject, options);
  const target = options.target ?? targetOf(inject, options.scale);
  const png = await options.renderer.render(document, target);

  return {
    png: addProvenance(png, {
      software: `injectlab ${await packageVersion()}`,
      kind: inject.kind,
      source: sourceOf(inject),
      ...(options.generatedFrom === undefined ? {} : { generatedFrom: options.generatedFrom }),
    }),
    findings,
  };
}

/**
 * Concurrency for a batch.
 *
 * Four, measured. The screenshot is CPU-bound inside the browser process, so four pages
 * contend and the speedup over sequential is about 1.3x rather than 4x. Raising this is
 * unlikely to pay, and twenty assets in a few seconds is already the right answer.
 */
const CONCURRENCY = 4;

export interface BatchResult extends RenderResult {
  inject: InjectSpec;
  index: number;
}

/**
 * Renders a batch through one renderer, preserving input order in the result.
 *
 * Reusing the browser saves a launch per asset, roughly 130 ms. That is worth having and it
 * is not the main cost, which is the screenshot itself.
 */
export async function renderAll(
  injects: readonly InjectSpec[],
  options: RenderInjectOptions,
): Promise<BatchResult[]> {
  const results = Array.from<BatchResult | undefined>({ length: injects.length });
  let next = 0;

  const worker = async () => {
    for (let index = next++; index < injects.length; index = next++) {
      const inject = injects[index];
      if (inject === undefined) continue;
      results[index] = { ...(await renderInject(inject, options)), inject, index };
    }
  };

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, injects.length) }, () => worker()));

  return results.filter((result): result is BatchResult => result !== undefined);
}
