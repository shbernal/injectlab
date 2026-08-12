/**
 * Public surface of `@injectlab/cli`.
 *
 * `run` is exported separately from the binary so tests drive it with injected io and
 * assert on the exit code, rather than spawning a process for every case.
 */

import { DEFAULT_DISCLAIMER } from '@injectlab/core';

export const EXIT_OK = 0;
export const EXIT_USAGE = 2;

/** Output sinks, injected so tests capture what the binary would print. */
export interface CliIo {
  out: (line: string) => void;
  err: (line: string) => void;
}

const USAGE = [
  'inject, generator of crisis-exercise stimuli',
  '',
  'Usage:',
  '  inject <command> [options]',
  '',
  'Commands:',
  '  (none yet, the scaffold is in place and the commands land next)',
  '',
  `Every generated asset carries the ${DEFAULT_DISCLAIMER} banner unless it is turned off,`,
  'and every PNG carries embedded provenance marking it as synthetic exercise material.',
].join('\n');

export function run(argv: readonly string[], io: CliIo): number {
  if (argv.length === 0 || argv.includes('--help') || argv.includes('-h')) {
    io.out(USAGE);
    return EXIT_OK;
  }

  io.err(`inject: unknown command ${JSON.stringify(argv[0] ?? '')}`);
  io.err("Run 'inject --help' for usage.");
  return EXIT_USAGE;
}
