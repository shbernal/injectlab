import { access, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import {
  formatForPath,
  formatSpecErrors,
  getOutlet,
  listOutlets,
  parseSpec,
} from '@injectlab/core';
import type { NewsInject } from '@injectlab/core';

import { EXIT_OK, EXIT_RENDER, EXIT_SPEC, EXIT_USAGE, UsageError } from './args.js';
import type { RenderFlags } from './args.js';
import type { CliContext } from './context.js';
import { demoSpecs } from './demo-specs.js';
import { runRender } from './run-render.js';
import type { RenderJob } from './run-render.js';

export async function demo(flags: RenderFlags, context: CliContext): Promise<number> {
  return runRender([{ injects: demoSpecs() }], flags, context);
}

export async function news(flags: RenderFlags, context: CliContext): Promise<number> {
  if (flags.outlet === undefined)
    throw new UsageError('news needs --outlet', "See 'inject outlets'.");
  if (flags.headline === undefined) throw new UsageError('news needs --headline');

  /**
   * A one-shot invocation should not make anyone type an ISO timestamp. The clock is read
   * here, once, at the boundary, and what it resolved to is printed. Core never reads it, so
   * the same spec still renders the same asset.
   */
  const publishedAt = flags.publishedAt ?? context.now().toISOString();
  if (flags.publishedAt === undefined && !flags.quiet && !flags.json) {
    context.io.err(`published-at not given, using ${publishedAt}`);
  }

  const inject: NewsInject = {
    kind: 'news',
    outlet: flags.outlet,
    headline: flags.headline,
    publishedAt,
    ...(flags.standfirst === undefined ? {} : { standfirst: flags.standfirst }),
    ...(flags.byline === undefined ? {} : { byline: flags.byline }),
    ...(flags.section === undefined ? {} : { section: flags.section }),
    ...(flags.url === undefined ? {} : { url: flags.url }),
    ...(flags.image === undefined ? {} : { image: { path: flags.image } }),
    ...(flags.variant === undefined ? {} : { variant: flags.variant }),
  };

  return runRender([{ injects: [inject] }], flags, context);
}

export async function render(flags: RenderFlags, context: CliContext): Promise<number> {
  const files = flags.positionals;
  if (files.length === 0) throw new UsageError('render needs at least one spec file');

  const jobs: RenderJob[] = [];
  let failed = false;

  for (const file of files) {
    let text: string;
    try {
      text = await readFile(file, 'utf8');
    } catch {
      context.io.err(`${file}: cannot read`);
      failed = true;
      continue;
    }

    const result = parseSpec(text, formatForPath(file));
    if (!result.ok) {
      for (const line of formatSpecErrors(file, result.errors)) context.io.err(line);
      failed = true;
      continue;
    }

    jobs.push({
      injects: result.injects,
      baseDir: path.dirname(path.resolve(file)),
      generatedFrom: path.basename(file),
    });
  }

  if (failed) return EXIT_SPEC;
  return runRender(jobs, flags, context);
}

export function outlets(flags: RenderFlags, context: CliContext): number {
  const all = listOutlets();

  if (flags.json) {
    context.io.out(
      JSON.stringify(
        all.map((outlet) => ({
          id: outlet.id,
          name: outlet.name,
          country: outlet.country,
          layout: outlet.layout,
          fidelity: outlet.fidelity,
        })),
      ),
    );
    return EXIT_OK;
  }

  const width = Math.max(...all.map((outlet) => outlet.id.length));

  for (const outlet of all) {
    context.io.out(
      `${outlet.id.padEnd(width)}  ${outlet.name}  (${outlet.country}, ${outlet.layout})`,
    );
    if (flags.verbose) {
      context.io.out(`${' '.repeat(width)}  ${outlet.fidelity}`);
      context.io.out('');
    }
  }

  return EXIT_OK;
}

const STARTER = `# An injectlab spec. Render it with:
#   inject render inject.yaml
#
# A file may hold one inject, as here, or a top-level 'injects:' list of them.

kind: news

# Run 'inject outlets' for the list, and 'inject outlets --verbose' for what each one
# approximates rather than reproduces.
outlet: bbc

headline: Northwind Logistics hit by ransomware, deliveries halted across the UK

# The deck under the headline.
standfirst: The haulier says its depots are running on paper and that it has notified the regulator.

# The reporter's name, without 'By'. The outlet decides how it is written.
byline: Helen Morrow

# Defaults to the outlet's own default section if omitted.
section: Technology

# ISO 8601 with an offset. Required in a file, and required to have an offset: without one it
# would be read against whatever time zone the machine rendering it happened to be in, and the
# same spec would produce different assets.
publishedAt: 2026-08-12T09:14:00+01:00

# Optional lead paragraphs.
body:
  - Northwind Logistics has taken its depot systems offline after what it described as a significant ransomware attack.
  - The regulator confirmed it had been notified and said it was in contact with the company.

# Optional local image, resolved relative to this file. Never a URL: rendering makes no
# network request.
# image:
#   path: ./depot.jpg
#   caption: The company's Leeds depot on Tuesday morning
#   credit: Northwind Logistics
`;

export async function init(flags: RenderFlags, context: CliContext): Promise<number> {
  const file = flags.positionals[0] ?? 'inject.yaml';

  try {
    await access(file);
    context.io.err(`${file} already exists`);
    return EXIT_USAGE;
  } catch {
    // Not there, which is what we want.
  }

  await writeFile(file, STARTER);
  context.io.err(`wrote ${file}`);
  context.io.err(`Render it with: inject render ${file}`);
  return EXIT_OK;
}

const MINIMUM_NODE_MAJOR = 24;

/**
 * The most likely first-run failure is a missing Chromium, and the difference between a tool
 * that looks finished and one that does not is whether that produces a Playwright stack trace
 * or one line saying what to type.
 */
export async function doctor(_flags: RenderFlags, context: CliContext): Promise<number> {
  let ok = true;

  const major = Number(process.versions.node.split('.')[0]);
  if (major >= MINIMUM_NODE_MAJOR) {
    context.io.out(`node ${process.versions.node}: ok`);
  } else {
    context.io.out(`node ${process.versions.node}: too old, needs ${MINIMUM_NODE_MAJOR} or newer`);
    ok = false;
  }

  try {
    const renderer = await context.createRenderer();
    await renderer.render('<!doctype html><title>doctor</title><p>ok', {
      width: 100,
      height: 100,
      scale: 1,
      format: 'png',
    });
    await renderer.close();
    context.io.out('chromium: ok');
  } catch (error) {
    context.io.out('chromium: not available');
    context.io.err(error instanceof Error ? error.message : String(error));
    context.io.err('');
    context.io.err('Install it with:');
    context.io.err('  npx playwright install chromium');
    ok = false;
  }

  const count = listOutlets().length;
  context.io.out(
    `outlets: ${count} (${listOutlets()
      .map((o) => o.id)
      .join(', ')})`,
  );
  // Cheap, and it is the check that catches a half-authored outlet reaching a user.
  for (const outlet of listOutlets()) {
    if (getOutlet(outlet.id as never).fidelity.trim() === '') {
      context.io.out(`outlet ${outlet.id}: no fidelity note`);
      ok = false;
    }
  }

  return ok ? EXIT_OK : EXIT_RENDER;
}
