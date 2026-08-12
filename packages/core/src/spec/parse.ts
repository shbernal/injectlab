import * as v from 'valibot';
import { parse as parseYaml } from 'yaml';

import type { InjectSpec } from './types.js';
import { BatchSchema, InjectSpecSchema } from './schema.js';

/**
 * Reading a spec file.
 *
 * `parseSpec` never throws. A malformed spec is an ordinary outcome for a tool whose input
 * is hand-written YAML, and making the caller wrap every call in a try block to print a
 * decent message is how tools end up printing stack traces at exercise designers.
 */

export type SpecFormat = 'yaml' | 'json';

export interface SpecError {
  /** Dotted path into the document, for example `injects.0.headline`. Empty at the root. */
  path: string;
  message: string;
  /** What was actually there, when the failure was about a value rather than its absence. */
  received?: string;
}

export type ParseResult = { ok: true; injects: InjectSpec[] } | { ok: false; errors: SpecError[] };

/** Infers the format from a file name, so callers do not each reimplement it. */
export function formatForPath(path: string): SpecFormat {
  return /\.json$/iu.test(path) ? 'json' : 'yaml';
}

export function parseSpec(text: string, format: SpecFormat): ParseResult {
  const document = readDocument(text, format);
  if (!document.ok) return document;

  if (isBatch(document.value)) {
    const result = v.safeParse(BatchSchema, document.value);
    return result.success
      ? { ok: true, injects: [...result.output.injects] }
      : { ok: false, errors: result.issues.map(toSpecError) };
  }

  const result = v.safeParse(InjectSpecSchema, document.value);
  return result.success
    ? { ok: true, injects: [result.output] }
    : { ok: false, errors: result.issues.map(toSpecError) };
}

/**
 * Picking the schema by shape rather than validating against a union. A union reports its
 * failure at the union itself and throws the field path away, and the field path is the
 * whole point of this layer.
 */
function isBatch(document: unknown): boolean {
  return typeof document === 'object' && document !== null && 'injects' in document;
}

function readDocument(
  text: string,
  format: SpecFormat,
): { ok: true; value: unknown } | { ok: false; errors: SpecError[] } {
  try {
    return { ok: true, value: format === 'json' ? JSON.parse(text) : parseYaml(text) };
  } catch (error) {
    return {
      ok: false,
      errors: [{ path: '', message: `not valid ${format.toUpperCase()}: ${messageOf(error)}` }],
    };
  }
}

function toSpecError(issue: v.BaseIssue<unknown>): SpecError {
  const path = (issue.path ?? [])
    .map((segment) => String((segment as { key?: unknown }).key ?? ''))
    .filter((key) => key !== '')
    .join('.');

  // valibot's own wording is precise but says "Invalid type: Expected string but received 3".
  // The custom messages on the schema read better; this only has to cover the ones left over.
  return {
    path,
    message: issue.message,
    ...(issue.received === undefined ? {} : { received: issue.received }),
  };
}

function messageOf(error: unknown): string {
  return error instanceof Error ? (error.message.split('\n')[0] ?? error.message) : String(error);
}

/** Renders errors the way the CLI prints them: `file: path: message`. */
export function formatSpecErrors(file: string, errors: readonly SpecError[]): string[] {
  return errors.map((error) => [file, error.path, error.message].filter(Boolean).join(': '));
}
