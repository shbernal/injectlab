#!/usr/bin/env node
/**
 * The `inject` binary. Thin on purpose: everything testable lives in `run`.
 */

import { run } from './index.js';

process.exitCode = run(process.argv.slice(2), {
  out: (line) => process.stdout.write(`${line}\n`),
  err: (line) => process.stderr.write(`${line}\n`),
});
