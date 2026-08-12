import path from 'node:path';

import {
  CharPolicyError,
  RemoteAssetError,
  RemoteNotPermittedError,
  buildDocument,
  formatCharFindings,
  prefetchRemoteAssets,
  renderAll,
  targetFor,
} from '@injectlab/core';
import type { InjectSpec, Renderer } from '@injectlab/core';

import { EXIT_CHARS, EXIT_OK, EXIT_RENDER, EXIT_USAGE } from './args.js';
import type { RenderFlags } from './args.js';
import { resolveOutPath, writeOutput } from './output.js';
import type { JsonReport, WrittenOutput } from './output.js';
import type { CliContext } from './context.js';

/**
 * The one render path.
 *
 * `demo`, `news` and `render` all end here, so the three cannot drift on output naming, exit
 * codes, JSON shape or how a character-gate failure is reported.
 */

export interface RenderJob {
  injects: InjectSpec[];
  /** Directory a relative image path resolves against, and the name recorded in the PNG. */
  baseDir?: string;
  generatedFrom?: string;
}

export async function runRender(
  jobs: readonly RenderJob[],
  flags: RenderFlags,
  context: CliContext,
): Promise<number> {
  const injects = jobs.flatMap((job) => job.injects);
  if (injects.length === 0) {
    context.io.err('nothing to render');
    return EXIT_RENDER;
  }

  const report: JsonReport = { ok: false, outputs: [], findings: [] };

  // Before the browser and before any composing, so a spec naming an unreachable host fails in
  // a second rather than after a Chromium launch, and so one mark shared by twenty injects
  // costs one request.
  let remoteAssets: ReadonlyMap<string, string>;
  try {
    remoteAssets = await prefetchRemoteAssets(injects, { allowRemote: flags.allowRemote });
    if (remoteAssets.size > 0 && !flags.quiet && !flags.json) {
      for (const url of remoteAssets.keys()) context.io.err(`fetched ${url}`);
    }
  } catch (error) {
    if (error instanceof RemoteNotPermittedError) {
      context.io.err(`a spec names a remote masthead: ${error.url}`);
      context.io.err('Rendering it would fetch from that host, which is off by default.');
      context.io.err('Pass --allow-remote to permit it, or use a local masthead.path instead.');
      if (flags.json) context.io.out(JSON.stringify(report));
      return EXIT_USAGE;
    }
    context.io.err(error instanceof RemoteAssetError ? error.message : String(error));
    if (flags.json) context.io.out(JSON.stringify(report));
    return EXIT_RENDER;
  }

  try {
    const outputs =
      flags.format === 'html'
        ? await writeDocuments(jobs, flags, remoteAssets, report)
        : await renderPngs(jobs, flags, remoteAssets, context, report);

    report.ok = true;
    report.outputs = outputs;
  } catch (error) {
    if (error instanceof CharPolicyError) {
      for (const line of formatCharFindings(error.findings)) context.io.err(line);
      context.io.err('');
      context.io.err('Rerun with --chars warn to render anyway, or --chars off to skip the check.');
      if (flags.json) context.io.out(JSON.stringify({ ...report, findings: error.findings }));
      return EXIT_CHARS;
    }

    context.io.err(error instanceof Error ? error.message : String(error));
    if (flags.json) context.io.out(JSON.stringify(report));
    return EXIT_RENDER;
  }

  if (flags.json) {
    context.io.out(JSON.stringify(report));
  } else if (!flags.quiet) {
    for (const output of report.outputs) {
      const size = output.width === undefined ? '' : ` ${output.width}x${output.height}`;
      context.io.err(`wrote ${output.path}${size}, ${output.bytes} bytes`);
    }
  }

  return EXIT_OK;
}

/** No browser is launched for `--format html`, which is what makes it useful for iterating. */
async function writeDocuments(
  jobs: readonly RenderJob[],
  flags: RenderFlags,
  remoteAssets: ReadonlyMap<string, string>,
  report: JsonReport,
): Promise<WrittenOutput[]> {
  const total = jobs.reduce((sum, job) => sum + job.injects.length, 0);
  const outputs: WrittenOutput[] = [];
  let index = 0;

  for (const job of jobs) {
    for (const inject of job.injects) {
      const document = await buildDocument(inject, {
        ...(flags.disclaimer === '' ? {} : { disclaimer: flags.disclaimer }),
        ...(flags.disclaimerStyle === undefined ? {} : { disclaimerStyle: flags.disclaimerStyle }),
        ...(job.baseDir === undefined ? {} : { baseDir: job.baseDir }),
        ...(remoteAssets.size === 0 ? {} : { remoteAssets }),
      });
      const target = resolveOutPath(flags.out, 'html', inject, index, total);
      outputs.push(await writeOutput(target, document, inject));
      index += 1;
    }
  }

  report.findings = [];
  return outputs;
}

async function renderPngs(
  jobs: readonly RenderJob[],
  flags: RenderFlags,
  remoteAssets: ReadonlyMap<string, string>,
  context: CliContext,
  report: JsonReport,
): Promise<WrittenOutput[]> {
  const renderer: Renderer = await context.createRenderer();
  const total = jobs.reduce((sum, job) => sum + job.injects.length, 0);
  const outputs: WrittenOutput[] = [];
  let index = 0;

  try {
    for (const job of jobs) {
      const results = await renderAll(job.injects, {
        renderer,
        chars: flags.chars,
        scale: flags.scale,
        // Only when the user asked for one. Left out, each kind keeps its own natural
        // target, so a post is drawn as a card rather than centred in an article viewport.
        ...(flags.variant === undefined ? {} : { target: targetFor(flags.variant, flags.scale) }),
        ...(flags.disclaimer === '' ? {} : { disclaimer: flags.disclaimer }),
        ...(flags.disclaimerStyle === undefined ? {} : { disclaimerStyle: flags.disclaimerStyle }),
        ...(job.baseDir === undefined ? {} : { baseDir: job.baseDir }),
        ...(job.generatedFrom === undefined ? {} : { generatedFrom: job.generatedFrom }),
        ...(remoteAssets.size === 0 ? {} : { remoteAssets }),
      });

      for (const result of results) {
        const target = resolveOutPath(flags.out, 'png', result.inject, index, total);
        outputs.push(await writeOutput(target, result.png, result.inject));
        index += 1;

        for (const finding of result.findings) {
          report.findings.push(
            job.generatedFrom === undefined
              ? finding
              : { ...finding, spec: path.basename(job.generatedFrom) },
          );
        }
      }
    }
  } finally {
    await renderer.close();
  }

  if (report.findings.length > 0 && !flags.json) {
    for (const line of formatCharFindings(report.findings)) context.io.err(`warning: ${line}`);
  }

  return outputs;
}
