import { chars, clauseSeparator, scanText } from 'charcheck';
import type { Rule } from 'charcheck';

import type { CharPolicy, InjectSpec, RenderOptions } from '../spec/types.js';

/**
 * The character gate.
 *
 * A headline written in a word processor or produced by a model arrives full of em dashes,
 * curly quotes and the occasional zero-width space. Rendered into a screenshot of a wire
 * story those read as wrong, and the invisibles are worse than wrong: they survive being
 * copied out of the exercise and into somewhere real.
 *
 * This runs over content, not over files, so no globs and no scope parsers are involved. The
 * default `raw` scope needs none of charcheck's optional peer dependencies, which is what
 * keeps `@injectlab/core` light.
 *
 * It runs before rendering, deliberately. Nobody should wait for Chromium to start in order
 * to be told their headline has a bad dash in it.
 */

/**
 * The surrounding whitespace is part of the match on purpose. `clauseSeparator` replaces the
 * dash with real punctuation, and without absorbing the spaces around it the suggestion comes
 * back with a double space where the dash used to be.
 */
const DASH_PATTERN = `\\s*[${chars.EM_DASH}${chars.HORIZONTAL_BAR}]\\s*`;

const INVISIBLES = [
  chars.SOFT_HYPHEN,
  chars.ZERO_WIDTH_SPACE,
  chars.ZERO_WIDTH_NON_JOINER,
  chars.ZERO_WIDTH_JOINER,
  chars.LEFT_TO_RIGHT_MARK,
  chars.RIGHT_TO_LEFT_MARK,
  chars.WORD_JOINER,
  chars.BYTE_ORDER_MARK,
];

/**
 * `include` is required by the type but ignored by `scanText`, which applies the rules it is
 * given and leaves file selection to the caller. There are no files here at all.
 */
const RULES: readonly Rule[] = [
  {
    id: 'no-em-dash',
    pattern: DASH_PATTERN,
    message: 'Use a comma, a colon, or reword.',
    fix: clauseSeparator,
    include: [],
  },
  {
    id: 'no-invisibles',
    chars: INVISIBLES,
    message: 'Invisible character. Delete it.',
    fix: '',
    include: [],
  },
];

export interface CharFinding {
  /** Dotted path to the offending field, for example `body.1` or `image.caption`. */
  field: string;
  ruleId: string;
  message: string;
  /** The offending character, named where charcheck knows a name for it. */
  match: string;
  /** 1-based offset into the field's own text. */
  column: number;
  /** What the field would become if the suggestion were taken. */
  suggestion?: string;
}

/** Every user-authored string in a spec, with the path a person would use to find it. */
export function userText(
  inject: InjectSpec,
  options?: Pick<RenderOptions, 'disclaimer'>,
): Map<string, string> {
  const fields = new Map<string, string>();
  const put = (field: string, value: string | undefined) => {
    if (value !== undefined && value !== '') fields.set(field, value);
  };

  put('headline', inject.headline);
  put('standfirst', inject.standfirst);
  put('byline', inject.byline);
  put('section', inject.section);
  inject.body?.forEach((paragraph, index) => put(`body.${index}`, paragraph));
  put('image.caption', inject.image?.caption);
  put('image.credit', inject.image?.credit);
  put('disclaimer', options?.disclaimer);

  return fields;
}

export async function scanInject(
  inject: InjectSpec,
  options?: Pick<RenderOptions, 'disclaimer'>,
): Promise<CharFinding[]> {
  const findings: CharFinding[] = [];

  for (const [field, text] of userText(inject, options)) {
    // `scanText` wants a file name for its findings. The field path is the honest answer:
    // it is what the user has to open and edit.
    const found = await scanText(text, field, RULES, { assumeText: true });

    for (const finding of found) {
      findings.push({
        field,
        ruleId: finding.ruleId,
        message: finding.message,
        match: finding.match,
        column: finding.column,
        ...(finding.replacement === undefined
          ? {}
          : { suggestion: applyOne(text, finding.offset, finding.match, finding.replacement) }),
      });
    }
  }

  return findings;
}

function applyOne(text: string, offset: number, match: string, replacement: string): string {
  return text.slice(0, offset) + replacement + text.slice(offset + match.length);
}

export class CharPolicyError extends Error {
  readonly findings: readonly CharFinding[];

  constructor(findings: readonly CharFinding[]) {
    super(`${findings.length} banned character${findings.length === 1 ? '' : 's'} in the inject`);
    this.name = 'CharPolicyError';
    this.findings = findings;
  }
}

export interface GateResult {
  /** Findings to report. Empty under `off`, and under `error` this is only reached when clean. */
  findings: readonly CharFinding[];
}

/**
 * Applies the policy. Throws under `error`, reports under `warn`, skips the scan entirely
 * under `off` so the cost is genuinely zero rather than merely ignored.
 */
export async function gate(
  inject: InjectSpec,
  policy: CharPolicy,
  options?: Pick<RenderOptions, 'disclaimer'>,
): Promise<GateResult> {
  if (policy === 'off') return { findings: [] };

  const findings = await scanInject(inject, options);
  if (policy === 'error' && findings.length > 0) throw new CharPolicyError(findings);
  return { findings };
}

/** One line per finding, in the shape the CLI prints. */
export function formatCharFindings(findings: readonly CharFinding[]): string[] {
  return findings.map((finding) => {
    const where = `${finding.field}:${finding.column}`;
    const suggestion = finding.suggestion === undefined ? '' : ` Suggested: ${finding.suggestion}`;
    return `${where}: ${finding.message}${suggestion}`;
  });
}
