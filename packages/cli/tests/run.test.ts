import { describe, expect, it } from 'vitest';

import { EXIT_OK, EXIT_USAGE, run } from '../src/index.js';
import type { CliIo } from '../src/index.js';

interface Recorder extends CliIo {
  lines: string[];
  errors: string[];
}

function collect(): Recorder {
  const lines: string[] = [];
  const errors: string[] = [];
  return {
    lines,
    errors,
    out: (line) => void lines.push(line),
    err: (line) => void errors.push(line),
  };
}

describe('run', () => {
  it('prints usage and succeeds when given no arguments', () => {
    const io = collect();
    expect(run([], io)).toBe(EXIT_OK);
    expect(io.lines.join('\n')).toContain('Usage:');
    expect(io.errors).toEqual([]);
  });

  it('prints usage for --help and for -h', () => {
    for (const flag of ['--help', '-h']) {
      const io = collect();
      expect(run([flag], io)).toBe(EXIT_OK);
      expect(io.lines.join('\n')).toContain('Usage:');
    }
  });

  it('states the exercise framing in the usage text, since that is the tool being described', () => {
    const io = collect();
    run([], io);
    expect(io.lines.join('\n')).toContain('[EXERCISE, EXERCISE, EXERCISE]');
  });

  it('reports an unknown command on stderr with a usage exit code', () => {
    const io = collect();
    expect(run(['render'], io)).toBe(EXIT_USAGE);
    expect(io.errors.join('\n')).toContain('unknown command');
    expect(io.lines).toEqual([]);
  });
});
