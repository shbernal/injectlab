/**
 * Public surface of `@injectlab/core`.
 *
 * Explicit re-exports, never `export *`. What is listed here is what consumers may depend
 * on, and adding to it is a decision rather than a side effect of creating a file.
 *
 * Nothing in this module imports Playwright, directly or transitively. The model has to be
 * usable in a plain test run with no browser installed.
 */

export type {
  CharPolicy,
  InjectImage,
  InjectMasthead,
  InjectSpec,
  InjectVariant,
  NewsInject,
  RenderOptions,
  XAuthor,
  XMetrics,
  XPostInject,
  XTheme,
} from './spec/types.js';

export { formatForPath, formatSpecErrors, parseSpec } from './spec/parse.js';
export type { ParseResult, SpecError, SpecFormat } from './spec/parse.js';

export {
  BatchSchema,
  InjectSpecSchema,
  MastheadSchema,
  NewsInjectSchema,
  XPostInjectSchema,
} from './spec/schema.js';

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
export type { CharFinding, DisclaimerContext, GateResult } from './text/chars.js';

export { formatByline, formatDate, formatTime, formatTimestamp } from './text/locale.js';
export type { TimeContext } from './text/locale.js';

export { buildDocument } from './render/compose.js';
export type { ComposeOptions } from './render/compose.js';
export {
  DEFAULT_DISCLAIMER,
  DISCLAIMER_CSS,
  NO_DISCLAIMER,
  disclaimerBand,
} from './render/disclaimer.js';
export { escapeHtml, html, raw, toHtmlString } from './render/html.js';
export type { Html } from './render/html.js';
export { DEFAULT_TARGET } from './render/renderer.js';
export type { Renderer, RenderTarget } from './render/renderer.js';
export {
  NotAPngError,
  PROVENANCE_COMMENT,
  addProvenance,
  pngSize,
  readProvenance,
} from './render/provenance.js';
export type { Provenance } from './render/provenance.js';
export { renderAll, renderInject, sourceOf, targetFor } from './render/render.js';
export type { BatchResult, RenderInjectOptions, RenderResult } from './render/render.js';
export { UnresolvedMastheadError, buildView } from './render/view.js';
export type { ArticleView, MastheadView, ViewContext } from './render/view.js';
export { IMAGE_TYPES, ImageError, embedImage } from './render/image.js';

/**
 * The only network path in the package, and it is off the render path by construction. A
 * caller fetches with these, then passes the result to `buildDocument` as `mastheadSrc`.
 * `buildDocument` itself still makes no request.
 */
export {
  RemoteAssetError,
  RemoteNotPermittedError,
  fetchRemoteImage,
  prefetchRemoteAssets,
  remoteUrlsIn,
} from './render/remote.js';
export type { PrefetchOptions } from './render/remote.js';
export { X_PLATFORM, xTheme, xThemes } from './render/platforms/x.js';
export type { PlatformTheme } from './render/platforms/x.js';
export { avatarColor, formatMetric, initials } from './render/layouts/x-post.js';

/**
 * `PlaywrightRenderer` is deliberately not re-exported here. Importing it pulls in
 * Playwright, and `@injectlab/core` has to stay importable in a test run with no browser
 * installed. Consumers reach it at `@injectlab/core/playwright`.
 */
