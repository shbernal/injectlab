/**
 * Public surface of `@injectlab/core`.
 *
 * Explicit re-exports, never `export *`. What is listed here is what consumers may depend
 * on, and adding to it is a decision rather than a side effect of creating a file.
 *
 * Nothing in this module imports Playwright, directly or transitively. The model has to be
 * usable in a plain test run with no browser installed.
 */

export { DEFAULT_DISCLAIMER } from './disclaimer.js';

export type {
  CharPolicy,
  InjectImage,
  InjectSpec,
  InjectVariant,
  NewsInject,
  RenderOptions,
} from './spec/types.js';
export { NO_DISCLAIMER } from './spec/types.js';

export { formatForPath, formatSpecErrors, parseSpec } from './spec/parse.js';
export type { ParseResult, SpecError, SpecFormat } from './spec/parse.js';

export { BatchSchema, InjectSpecSchema, NewsInjectSchema } from './spec/schema.js';

export type {
  DateFormat,
  FontSpec,
  LayoutFamily,
  Outlet,
  OutletConventions,
  OutletTheme,
} from './outlets/types.js';
export { getOutlet, isOutletId, listOutletIds, listOutlets } from './outlets/registry.js';
export type { OutletId } from './outlets/registry.js';

export {
  FONT_ASSET_DIR,
  getTypeface,
  isTypefaceId,
  listTypefaces,
  typefaceFileUrl,
  typefaceLicenceUrl,
} from './fonts/catalogue.js';
export type { Typeface, TypefaceId } from './fonts/catalogue.js';

export { CharPolicyError, formatCharFindings, gate, scanInject, userText } from './text/chars.js';
export type { CharFinding, GateResult } from './text/chars.js';

export { formatByline, formatDate, formatTime, formatTimestamp } from './text/locale.js';
