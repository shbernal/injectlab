import type { OutletId } from '../outlets/registry.js';

/**
 * What the exercise designer writes.
 *
 * A discriminated union over `kind`, so a new channel slots in without touching the news
 * type. Every kind stays flat: this is a spec file a person edits between meetings, not a
 * configuration format.
 */
export type InjectSpec = NewsInject;

export interface NewsInject {
  kind: 'news';
  outlet: OutletId;
  headline: string;
  /** The deck or chapeau under the headline. */
  standfirst?: string;
  /** Raw name. The outlet's conventions decide whether it becomes 'By Jane Doe' or 'Par ...'. */
  byline?: string;
  /** Defaults to the outlet's own default section. */
  section?: string;
  /**
   * ISO 8601 with an offset. Required and explicit: reading the clock at render time would
   * mean the same spec produced a different asset on every run.
   */
  publishedAt: string;
  /** Lead paragraphs, for layouts that show body text. */
  body?: string[];
  /** Shown in the address bar where the layout has one. Synthesised from the outlet if absent. */
  url?: string;
  image?: InjectImage;
  variant?: InjectVariant;
}

export interface InjectImage {
  /**
   * A local file, resolved relative to the spec file. Never a URL: rendering does not touch
   * the network, and an asset that resolves differently on someone else's machine is not an
   * asset.
   */
  path: string;
  caption?: string;
  credit?: string;
}

/**
 * Selects a viewport preset defined by the outlet, not a raw pixel size, so 'mobile' means
 * what that outlet's mobile site means.
 */
export type InjectVariant = 'desktop' | 'mobile' | 'card';

/** How to render, as opposed to what to render. Carried alongside every kind. */
export interface RenderOptions {
  /** Banner text, or 'none' to omit the band. Embedded PNG provenance is unaffected. */
  disclaimer: string;
  /** deviceScaleFactor. */
  scale: 1 | 2 | 3;
  /** What to do when user text contains a banned character. */
  chars: CharPolicy;
  /** Output path or directory. */
  out: string;
}

export type CharPolicy = 'error' | 'warn' | 'off';

/** Sentinel for `disclaimer`, so 'none' is not mistaken for a caller wanting that word. */
export const NO_DISCLAIMER = 'none';
