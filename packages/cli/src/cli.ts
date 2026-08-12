#!/usr/bin/env node
/**
 * The `inject` binary. Thin on purpose: everything testable lives in `run`.
 */

import { defaultContext } from './context.js';
import { run, stdio } from './index.js';

process.exitCode = await run(process.argv.slice(2), defaultContext(stdio()));
