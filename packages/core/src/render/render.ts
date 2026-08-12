import { readFile } from 'node:fs/promises';

import { gate } from '../text/chars.js';
import type { CharFinding } from '../text/chars.js';
import type { CharPolicy, InjectVariant, NewsInject } from '../spec/types.js';
import { buildDocument } from './compose.js';
import type { ComposeOptions } from './compose.js';
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

let cachedVersion: string | undefined;

/** Read rather than hardcoded, so the provenance cannot claim a version that is not shipping. */
async function packageVersion(): Promise<string> {
  if (cachedVersion === undefined) {
    const manifest: unknown = JSON.parse(
      await readFile(new URL('../../package.json', import.meta.url), 'utf8'),
    );
    cachedVersion =
      typeof manifest === 'object' && manifest !== null && 'version' in manifest
        ? String(manifest.version)
        : '0.0.0';
  }
  return cachedVersion;
}

export interface RenderInjectOptions extends ComposeOptions {
  renderer: Renderer;
  /** Defaults to the inject's variant at scale 2. */
  target?: RenderTarget;
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
  inject: NewsInject,
  options: RenderInjectOptions,
): Promise<RenderResult> {
  const { findings } = await gate(
    inject,
    options.chars ?? 'error',
    options.disclaimer === undefined ? undefined : { disclaimer: options.disclaimer },
  );

  const document = await buildDocument(inject, options);
  const target = options.target ?? targetFor(inject.variant);
  const png = await options.renderer.render(document, target);

  return {
    png: addProvenance(png, {
      software: `injectlab ${await packageVersion()}`,
      kind: inject.kind,
      outlet: inject.outlet,
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
  inject: NewsInject;
  index: number;
}

/**
 * Renders a batch through one renderer, preserving input order in the result.
 *
 * Reusing the browser saves a launch per asset, roughly 130 ms. That is worth having and it
 * is not the main cost, which is the screenshot itself.
 */
export async function renderAll(
  injects: readonly NewsInject[],
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
