/**
 * Public surface of `@injectlab/cli`.
 *
 * `run` is exported separately from the binary so tests drive it in process with a fake
 * renderer and captured output, and assert on the exit code. Spawning a process per case
 * would be slower and would prove less.
 */

import { EXIT_OK, EXIT_USAGE, UsageError, parseFlags } from './args.js';
import * as commands from './commands.js';
import type { CliContext, CliIo } from './context.js';
import { COMMAND_HELP, MAIN } from './help.js';

export { EXIT_CHARS, EXIT_OK, EXIT_RENDER, EXIT_SPEC, EXIT_USAGE } from './args.js';
export type { CliContext, CliIo } from './context.js';
export { defaultContext } from './context.js';

type Command = (
  flags: ReturnType<typeof parseFlags>,
  context: CliContext,
) => number | Promise<number>;

const COMMANDS: Record<string, Command> = {
  demo: commands.demo,
  news: commands.news,
  render: commands.render,
  outlets: commands.outlets,
  init: commands.init,
  doctor: commands.doctor,
};

/** Suggests the intended command when someone types a near miss. */
function nearest(name: string): string | undefined {
  const known = Object.keys(COMMANDS);
  return known.find((candidate) => candidate.startsWith(name) || name.startsWith(candidate));
}

export async function run(argv: readonly string[], context: CliContext): Promise<number> {
  const [name, ...rest] = argv;

  if (name === undefined || name === '--help' || name === '-h') {
    context.io.out(MAIN);
    return EXIT_OK;
  }

  if (name === '--version') {
    context.io.out(await version());
    return EXIT_OK;
  }

  const command = COMMANDS[name];
  if (command === undefined) {
    context.io.err(`unknown command ${JSON.stringify(name)}`);
    const suggestion = nearest(name);
    if (suggestion !== undefined) context.io.err(`Did you mean 'inject ${suggestion}'?`);
    context.io.err("Run 'inject --help' for the command list.");
    return EXIT_USAGE;
  }

  try {
    const flags = parseFlags(rest);

    if (flags.help) {
      context.io.out(COMMAND_HELP[name] ?? MAIN);
      return EXIT_OK;
    }

    return await command(flags, context);
  } catch (error) {
    if (error instanceof UsageError) {
      context.io.err(`inject ${name}: ${error.message}`);
      if (error.hint !== undefined) context.io.err(error.hint);
      return EXIT_USAGE;
    }
    throw error;
  }
}

async function version(): Promise<string> {
  const { readFile } = await import('node:fs/promises');
  const manifest: unknown = JSON.parse(
    await readFile(new URL('../package.json', import.meta.url), 'utf8'),
  );
  return typeof manifest === 'object' && manifest !== null && 'version' in manifest
    ? String(manifest.version)
    : '0.0.0';
}

/** Convenience for embedders: the default context wired to real stdio. */
export function stdio(): CliIo {
  return {
    out: (line) => process.stdout.write(`${line}\n`),
    err: (line) => process.stderr.write(`${line}\n`),
  };
}
