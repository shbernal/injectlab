/**
 * HTML assembly where escaping is the default.
 *
 * This tool's entire input is attacker-shaped text by design. Every field of an inject is
 * written by someone inventing a hostile scenario, and a headline containing `</style>` has
 * to produce a funny headline rather than a broken page. So interpolation escapes, and the
 * only way to inject markup is to say `raw`, which is one greppable word.
 *
 *     html`<h1>${inject.headline}</h1>`     escaped
 *     html`<div>${raw(layoutMarkup)}</div>` not escaped, and visibly so
 */

const RAW = Symbol('injectlab.raw');

export interface Html {
  readonly [RAW]: string;
}

const ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/** Escapes text for element content and for quoted attribute values alike. */
export function escapeHtml(text: string): string {
  return text.replaceAll(/[&<>"']/gu, (character) => ENTITIES[character] ?? character);
}

/**
 * Marks a string as already-safe markup.
 *
 * Every call is a place where the escaping was skipped, so every call should be obvious in
 * review. There are no other escape hatches.
 */
export function raw(markup: string): Html {
  return { [RAW]: markup };
}

export const EMPTY: Html = raw('');

function isHtml(value: unknown): value is Html {
  return typeof value === 'object' && value !== null && RAW in value;
}

/**
 * `undefined`, `null` and `false` render as nothing, so a conditional fragment can be written
 * as `${condition && html\`...\`}` without leaving the word "false" in the page.
 */
function stringify(value: unknown): string {
  if (value === undefined || value === null || value === false) return '';
  if (isHtml(value)) return value[RAW];
  if (Array.isArray(value)) return value.map(stringify).join('');
  return escapeHtml(String(value));
}

export function html(strings: TemplateStringsArray, ...values: readonly unknown[]): Html {
  let out = strings[0] ?? '';
  for (const [index, value] of values.entries()) {
    out += stringify(value) + (strings[index + 1] ?? '');
  }
  return raw(out);
}

/** The final step out of the type, for writing a document to disk or to a browser. */
export function toHtmlString(node: Html): string {
  return node[RAW];
}
