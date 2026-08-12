import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { chars } from 'charcheck';
import { listOutletIds } from '@injectlab/core';
import type { Renderer, RenderTarget } from '@injectlab/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { EXIT_CHARS, EXIT_OK, EXIT_RENDER, EXIT_SPEC, EXIT_USAGE, run } from '../src/index.js';
import type { CliContext } from '../src/context.js';
import { demoSpecs } from '../src/demo-specs.js';
import { tinyPng } from './png-fixture.js';

/**
 * The CLI is driven in process against a fake renderer. Spawning a binary per case would be
 * slower, would need a browser, and would prove less: what matters here is the exit code and
 * what went to which stream.
 */

class FakeRenderer implements Renderer {
  readonly calls: RenderTarget[] = [];
  closed = false;

  render(_html: string, target: RenderTarget): Promise<Uint8Array> {
    this.calls.push(target);
    return Promise.resolve(tinyPng(target.width * target.scale, 900));
  }

  close(): Promise<void> {
    this.closed = true;
    return Promise.resolve();
  }
}

/** A renderer that cannot start, standing in for a machine with no Chromium. */
class BrokenRenderer implements Renderer {
  render(): Promise<Uint8Array> {
    return Promise.reject(new Error('Executable does not exist at /nope/chrome'));
  }
  close(): Promise<void> {
    return Promise.resolve();
  }
}

interface Harness {
  context: CliContext;
  out: string[];
  err: string[];
  renderer: FakeRenderer;
  dir: string;
}

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(path.join(os.tmpdir(), 'injectlab-cli-'));
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

function harness(renderer: Renderer = new FakeRenderer()): Harness {
  const out: string[] = [];
  const err: string[] = [];

  return {
    out,
    err,
    dir,
    renderer: renderer as FakeRenderer,
    context: {
      io: { out: (line) => void out.push(line), err: (line) => void err.push(line) },
      createRenderer: () => Promise.resolve(renderer),
      // Fixed, so a test never depends on when it ran.
      now: () => new Date('2026-08-12T09:14:00Z'),
    },
  };
}

const NEWS = [
  'news',
  '--outlet',
  'bbc',
  '--headline',
  'Northwind Logistics hit by ransomware',
] as const;

describe('dispatch', () => {
  it('prints the command list with no arguments', async () => {
    const h = harness();
    expect(await run([], h.context)).toBe(EXIT_OK);
    expect(h.out.join('\n')).toContain('Commands:');
  });

  it('states the exercise framing in the top-level help', async () => {
    const h = harness();
    await run(['--help'], h.context);
    expect(h.out.join('\n')).toContain('[EXERCISE, EXERCISE, EXERCISE]');
    expect(h.out.join('\n')).toContain('not switchable');
  });

  it('suggests the nearest command for a near miss', async () => {
    const h = harness();
    expect(await run(['outlet'], h.context)).toBe(EXIT_USAGE);
    expect(h.err.join('\n')).toContain("Did you mean 'inject outlets'?");
  });

  it('prints per-command help with a worked example', async () => {
    const h = harness();
    expect(await run(['news', '--help'], h.context)).toBe(EXIT_OK);
    expect(h.out.join('\n')).toContain('inject news --outlet bbc');
    expect(h.out.join('\n')).toContain('Northwind Logistics');
  });
});

describe('flag validation', () => {
  it('exits 2 and lists the known outlets for an unknown one', async () => {
    const h = harness();
    expect(await run(['news', '--outlet', 'lefigaro', '--headline', 'x'], h.context)).toBe(
      EXIT_USAGE,
    );
    expect(h.err.join('\n')).toContain('unknown outlet');
    expect(h.err.join('\n')).toContain('bbc');
  });

  it('exits 2 for an unknown flag', async () => {
    const h = harness();
    expect(await run(['news', '--outlets', 'bbc'], h.context)).toBe(EXIT_USAGE);
    expect(h.err.join('\n')).toMatch(/unknown option/iu);
  });

  it('exits 2 for a bad enum value, naming what is allowed', async () => {
    const h = harness();
    expect(await run([...NEWS, '--scale', '4'], h.context)).toBe(EXIT_USAGE);
    expect(h.err.join('\n')).toContain('--scale must be one of: 1, 2, 3');
  });

  it('exits 2 when a required flag is missing', async () => {
    const h = harness();
    expect(await run(['news', '--outlet', 'bbc'], h.context)).toBe(EXIT_USAGE);
    expect(h.err.join('\n')).toContain('needs --headline');
  });

  it('names the disclaimer styles rather than accepting an invented one', async () => {
    const h = harness();
    expect(await run([...NEWS, '--disclaimer-style', 'invisible'], h.context)).toBe(EXIT_USAGE);
    expect(h.err.join('\n')).toContain('--disclaimer-style must be one of: bold, band, quiet');
  });
});

describe('news', () => {
  it('renders one PNG and says where it went', async () => {
    const h = harness();
    expect(await run([...NEWS, '--out', h.dir], h.context)).toBe(EXIT_OK);

    const files = await readdir(h.dir);
    expect(files).toHaveLength(1);
    expect(files[0]).toMatch(/^01-bbc-northwind-logistics-hit-by-ransomware\.png$/u);
    expect(h.err.join('\n')).toContain('wrote');
  });

  /**
   * A one-shot invocation should not force anyone to type a timestamp, but silently invented
   * data is worse than an inconvenience, so the CLI says what it used.
   */
  it('resolves publishedAt from the clock once and reports it', async () => {
    const h = harness();
    await run([...NEWS, '--out', h.dir], h.context);
    expect(h.err.join('\n')).toContain('published-at not given, using 2026-08-12T09:14:00.000Z');
  });

  it('says nothing about the clock when the flag was given', async () => {
    const h = harness();
    await run([...NEWS, '--published-at', '2026-01-01T00:00:00Z', '--out', h.dir], h.context);
    expect(h.err.join('\n')).not.toContain('published-at not given');
  });

  it('writes to the exact path when --out names a file', async () => {
    const h = harness();
    const target = path.join(h.dir, 'report.png');
    expect(await run([...NEWS, '--out', target], h.context)).toBe(EXIT_OK);
    expect((await readdir(h.dir))[0]).toBe('report.png');
  });

  it('renders at the requested variant and scale', async () => {
    const h = harness();
    await run([...NEWS, '--variant', 'card', '--scale', '3', '--out', h.dir], h.context);
    expect(h.renderer.calls[0]).toEqual({ width: 1200, height: 630, scale: 3, format: 'png' });
  });

  it('closes the renderer even though the caller owns it', async () => {
    const h = harness();
    await run([...NEWS, '--out', h.dir], h.context);
    expect(h.renderer.closed).toBe(true);
  });
});

describe('--format html', () => {
  it('writes the composed document and never asks for a renderer', async () => {
    const h = harness();
    expect(await run([...NEWS, '--format', 'html', '--out', h.dir], h.context)).toBe(EXIT_OK);

    const files = await readdir(h.dir);
    expect(files[0]).toMatch(/\.html$/u);

    const document = await readFile(path.join(h.dir, files[0] ?? ''), 'utf8');
    expect(document).toContain('<!doctype html>');
    expect(document).toContain('Northwind Logistics hit by ransomware');
    expect(h.renderer.calls).toHaveLength(0);
  });

  /** The one place the flag can be checked against what actually reaches the page. */
  it('carries --disclaimer-style through to the composed document', async () => {
    const h = harness();
    const flags = ['--format', 'html', '--disclaimer-style', 'band', '--out', h.dir];
    expect(await run([...NEWS, ...flags], h.context)).toBe(EXIT_OK);

    const files = await readdir(h.dir);
    const document = await readFile(path.join(h.dir, files[0] ?? ''), 'utf8');
    expect(document).toContain('il-exercise--band il-exercise--bottom');
  });
});

describe('the character gate', () => {
  const bad = ['--headline', `Offline ${chars.EM_DASH} regulator notified`];

  it('exits 3, which is the code an agent loop branches on', async () => {
    const h = harness();
    expect(await run(['news', '--outlet', 'bbc', ...bad, '--out', h.dir], h.context)).toBe(
      EXIT_CHARS,
    );
  });

  it('reports the field, the position and a suggestion, and says how to proceed', async () => {
    const h = harness();
    await run(['news', '--outlet', 'bbc', ...bad, '--out', h.dir], h.context);

    const errors = h.err.join('\n');
    expect(errors).toMatch(/^headline:\d+: /mu);
    expect(errors).toContain('Suggested:');
    expect(errors).toContain('--chars warn');
  });

  it('renders anyway under warn, still reporting', async () => {
    const h = harness();
    expect(
      await run(['news', '--outlet', 'bbc', ...bad, '--chars', 'warn', '--out', h.dir], h.context),
    ).toBe(EXIT_OK);

    expect(h.err.join('\n')).toContain('warning:');
    expect(await readdir(h.dir)).toHaveLength(1);
  });

  it('renders silently under off', async () => {
    const h = harness();
    expect(
      await run(['news', '--outlet', 'bbc', ...bad, '--chars', 'off', '--out', h.dir], h.context),
    ).toBe(EXIT_OK);
    expect(h.err.join('\n')).not.toContain('warning:');
  });
});

describe('render', () => {
  const SPEC = `
kind: news
outlet: bbc
headline: Northwind Logistics hit by ransomware
publishedAt: 2026-08-12T09:14:00+01:00
`;

  it('renders a spec file', async () => {
    const h = harness();
    const spec = path.join(h.dir, 'inject.yaml');
    await writeFile(spec, SPEC);

    expect(await run(['render', spec, '--out', h.dir], h.context)).toBe(EXIT_OK);
    expect((await readdir(h.dir)).filter((f) => f.endsWith('.png'))).toHaveLength(1);
  });

  it('renders every inject in a batch file, numbering the outputs', async () => {
    const h = harness();
    const spec = path.join(h.dir, 'batch.yaml');
    await writeFile(
      spec,
      `injects:\n${['First story', 'Second story']
        .map(
          (headline) =>
            `  - kind: news\n    outlet: bbc\n    headline: ${headline}\n    publishedAt: 2026-08-12T09:14:00Z\n`,
        )
        .join('')}`,
    );

    expect(await run(['render', spec, '--out', path.join(h.dir, 'o')], h.context)).toBe(EXIT_OK);
    const files = (await readdir(path.join(h.dir, 'o'))).toSorted();
    expect(files).toEqual(['01-bbc-first-story.png', '02-bbc-second-story.png']);
  });

  it('exits 4 with a field path for a malformed spec', async () => {
    const h = harness();
    const spec = path.join(h.dir, 'bad.yaml');
    await writeFile(
      spec,
      'kind: news\noutlet: bbc\nheadline: 3\npublishedAt: 2026-08-12T09:14:00Z\n',
    );

    expect(await run(['render', spec, '--out', h.dir], h.context)).toBe(EXIT_SPEC);
    expect(h.err.join('\n')).toContain('bad.yaml: headline:');
  });

  /** A spec file is meant to reproduce, so the clock is not consulted for one. */
  it('exits 4 when a spec file omits publishedAt, rather than inventing it', async () => {
    const h = harness();
    const spec = path.join(h.dir, 'no-date.yaml');
    await writeFile(spec, 'kind: news\noutlet: bbc\nheadline: A story\n');

    expect(await run(['render', spec, '--out', h.dir], h.context)).toBe(EXIT_SPEC);
    expect(h.err.join('\n')).toContain('publishedAt');
  });

  it('exits 4 for a file it cannot read', async () => {
    const h = harness();
    expect(await run(['render', path.join(h.dir, 'nope.yaml')], h.context)).toBe(EXIT_SPEC);
    expect(h.err.join('\n')).toContain('cannot read');
  });

  it('exits 2 with no files given', async () => {
    const h = harness();
    expect(await run(['render'], h.context)).toBe(EXIT_USAGE);
  });
});

describe('demo', () => {
  it('renders every built-in demo with no arguments beyond the destination', async () => {
    const h = harness();
    expect(await run(['demo', '--out', h.dir], h.context)).toBe(EXIT_OK);

    // Derived rather than counted, so adding an outlet or a kind does not make this wrong.
    const expected = demoSpecs().length;
    expect((await readdir(h.dir)).filter((file) => file.endsWith('.png'))).toHaveLength(expected);
  });

  it('covers every outlet, and the platform as well', async () => {
    const h = harness();
    await run(['demo', '--out', h.dir], h.context);
    const files = await readdir(h.dir);

    for (const id of [...listOutletIds(), 'x']) {
      expect(
        files.some((file) => file.includes(`-${id}-`)),
        id,
      ).toBe(true);
    }
  });
});

describe('--json', () => {
  it('puts one parseable object on stdout and every diagnostic on stderr', async () => {
    const h = harness();
    expect(await run([...NEWS, '--json', '--out', h.dir], h.context)).toBe(EXIT_OK);

    expect(h.out).toHaveLength(1);
    const report: unknown = JSON.parse(h.out[0] ?? '');
    expect(report).toMatchObject({ ok: true, findings: [] });

    const { outputs } = report as { outputs: Record<string, unknown>[] };
    expect(outputs).toHaveLength(1);
    expect(outputs[0]).toMatchObject({ kind: 'news', source: 'bbc', width: 2400, height: 900 });
    expect(typeof outputs[0]?.bytes).toBe('number');
  });

  it('carries no ANSI escapes, so a parser does not have to strip them', async () => {
    const h = harness();
    await run([...NEWS, '--json', '--out', h.dir], h.context);
    // Built from the code point rather than pasted, since the character is invisible here too.
    expect(h.out[0]).not.toContain(String.fromCodePoint(0x1b));
  });

  it('still reports ok false and the findings when the gate rejects', async () => {
    const h = harness();
    const code = await run(
      ['news', '--outlet', 'bbc', '--headline', `A ${chars.EM_DASH} b`, '--json', '--out', h.dir],
      h.context,
    );

    expect(code).toBe(EXIT_CHARS);
    const report = JSON.parse(h.out[0] ?? '') as { ok: boolean; findings: unknown[] };
    expect(report.ok).toBe(false);
    expect(report.findings).toHaveLength(1);
  });
});

describe('outlets', () => {
  it('lists id, name, country and layout family', async () => {
    const h = harness();
    expect(await run(['outlets'], h.context)).toBe(EXIT_OK);
    expect(h.out.join('\n')).toMatch(/bbc\s+BBC News\s+\(uk, uk-online-broadsheet\)/u);
  });

  it('adds the fidelity note under --verbose', async () => {
    const h = harness();
    await run(['outlets', '--verbose'], h.context);
    expect(h.out.join('\n')).toMatch(/approximat/iu);
  });

  it('emits JSON including the fidelity note', async () => {
    const h = harness();
    await run(['outlets', '--json'], h.context);
    const list = JSON.parse(h.out[0] ?? '') as { id: string; fidelity: string }[];
    expect(list[0]?.id).toBe('bbc');
    expect(list[0]?.fidelity.length).toBeGreaterThan(60);
  });
});

describe('init', () => {
  it('writes a commented starter spec that actually renders', async () => {
    const h = harness();
    const file = path.join(h.dir, 'inject.yaml');

    expect(await run(['init', file], h.context)).toBe(EXIT_OK);
    expect(await run(['render', file, '--out', path.join(h.dir, 'o')], h.context)).toBe(EXIT_OK);
  });

  it('refuses to overwrite an existing file', async () => {
    const h = harness();
    const file = path.join(h.dir, 'inject.yaml');
    await writeFile(file, 'kept');

    expect(await run(['init', file], h.context)).toBe(EXIT_USAGE);
    expect(await readFile(file, 'utf8')).toBe('kept');
  });
});

describe('doctor', () => {
  it('reports a working machine', async () => {
    const h = harness();
    expect(await run(['doctor'], h.context)).toBe(EXIT_OK);
    expect(h.out.join('\n')).toContain('chromium: ok');
    expect(h.out.join('\n')).toMatch(/^node \d/mu);
  });

  /** The most likely first-run failure. One line to type, not a Playwright stack trace. */
  it('prints the install command when Chromium is missing', async () => {
    const h = harness(new BrokenRenderer());
    expect(await run(['doctor'], h.context)).toBe(EXIT_RENDER);
    expect(h.out.join('\n')).toContain('chromium: not available');
    expect(h.err.join('\n')).toContain('npx playwright install chromium');
  });
});
