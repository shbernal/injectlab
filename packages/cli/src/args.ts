import { parseArgs } from 'node:util';

import { isOutletId, listOutletIds } from '@injectlab/core';
import type { CharPolicy, InjectVariant, OutletId } from '@injectlab/core';

/**
 * Flag parsing.
 *
 * `node:util`'s `parseArgs` rather than a framework. The command surface is small enough that
 * a dependency would be the larger cost, and the failure modes worth handling well are the
 * ones `parseArgs` leaves to the caller anyway: unknown flags, bad enum values, missing
 * required flags.
 */

export const EXIT_OK = 0;
export const EXIT_RENDER = 1;
export const EXIT_USAGE = 2;
export const EXIT_CHARS = 3;
export const EXIT_SPEC = 4;

/** Thrown for anything the user can fix by retyping the command. */
export class UsageError extends Error {
  readonly hint: string | undefined;

  constructor(message: string, hint?: string) {
    super(message);
    this.name = 'UsageError';
    this.hint = hint;
  }
}

const OPTIONS = {
  outlet: { type: 'string' },
  headline: { type: 'string' },
  standfirst: { type: 'string' },
  byline: { type: 'string' },
  section: { type: 'string' },
  'published-at': { type: 'string' },
  url: { type: 'string' },
  image: { type: 'string' },
  variant: { type: 'string' },
  out: { type: 'string' },
  format: { type: 'string' },
  scale: { type: 'string' },
  disclaimer: { type: 'string' },
  chars: { type: 'string' },
  json: { type: 'boolean', default: false },
  quiet: { type: 'boolean', default: false },
  verbose: { type: 'boolean', default: false },
  help: { type: 'boolean', short: 'h', default: false },
} as const;

export interface RenderFlags {
  outlet?: OutletId;
  headline?: string;
  standfirst?: string;
  byline?: string;
  section?: string;
  publishedAt?: string;
  url?: string;
  image?: string;
  variant: InjectVariant;
  out: string;
  format: 'png' | 'html';
  scale: 1 | 2 | 3;
  disclaimer: string;
  chars: CharPolicy;
  json: boolean;
  quiet: boolean;
  verbose: boolean;
  help: boolean;
  positionals: string[];
}

function oneOf<T extends string>(
  flag: string,
  value: string | undefined,
  allowed: readonly T[],
  fallback: T,
): T {
  if (value === undefined) return fallback;
  if ((allowed as readonly string[]).includes(value)) return value as T;
  throw new UsageError(
    `--${flag} must be one of: ${allowed.join(', ')}`,
    `got ${JSON.stringify(value)}`,
  );
}

export function parseFlags(argv: readonly string[]): RenderFlags {
  let parsed;
  try {
    parsed = parseArgs({ args: [...argv], options: OPTIONS, allowPositionals: true });
  } catch (error) {
    // parseArgs says "Unknown option '--outlets'". Worth keeping, worth adding to.
    throw new UsageError(
      error instanceof Error ? error.message : String(error),
      "Run 'inject --help' for the flag list.",
    );
  }

  const { values, positionals } = parsed;

  if (values.outlet !== undefined && !isOutletId(values.outlet)) {
    throw new UsageError(
      `unknown outlet ${JSON.stringify(values.outlet)}`,
      `Known outlets: ${listOutletIds().join(', ')}`,
    );
  }

  const scale = oneOf('scale', values.scale, ['1', '2', '3'], '2');

  return {
    ...(values.outlet === undefined ? {} : { outlet: values.outlet as OutletId }),
    ...(values.headline === undefined ? {} : { headline: values.headline }),
    ...(values.standfirst === undefined ? {} : { standfirst: values.standfirst }),
    ...(values.byline === undefined ? {} : { byline: values.byline }),
    ...(values.section === undefined ? {} : { section: values.section }),
    ...(values['published-at'] === undefined ? {} : { publishedAt: values['published-at'] }),
    ...(values.url === undefined ? {} : { url: values.url }),
    ...(values.image === undefined ? {} : { image: values.image }),
    variant: oneOf('variant', values.variant, ['desktop', 'mobile', 'card'], 'desktop'),
    out: values.out ?? 'out',
    format: oneOf('format', values.format, ['png', 'html'], 'png'),
    scale: Number(scale) as 1 | 2 | 3,
    disclaimer: values.disclaimer ?? '',
    chars: oneOf('chars', values.chars, ['error', 'warn', 'off'], 'error'),
    json: values.json,
    quiet: values.quiet,
    verbose: values.verbose,
    help: values.help,
    positionals,
  };
}
