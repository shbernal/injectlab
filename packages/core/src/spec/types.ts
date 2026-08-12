import type { OutletId } from '../outlets/registry.js';
import type { DisclaimerStyle } from '../render/disclaimer.js';

/**
 * What the exercise designer writes.
 *
 * A discriminated union over `kind`, so a new channel slots in without touching the news
 * type. Every kind stays flat: this is a spec file a person edits between meetings, not a
 * configuration format.
 */
export type InjectSpec = NewsInject | XPostInject;

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
  /** Replaces the outlet's approximated masthead with a mark you supply. See `InjectMasthead`. */
  masthead?: InjectMasthead;
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
 * A masthead supplied by the exercise designer, in place of the outlet's approximation.
 *
 * This exists for the mark you have the right to use: your own organisation's newsroom, or a
 * fictional outlet somebody drew for you. It is not a fidelity feature for real publications,
 * and pointing it at a downloaded logo does not make that logo yours. What the repository
 * ships is unchanged either way: every bundled outlet still approximates, and
 * `docs/use-policy.md` still describes what is in the box.
 *
 * Exactly one of `path` and `url` is required.
 */
export interface InjectMasthead {
  /** A local file, resolved relative to the spec file, like `InjectImage.path`. */
  path?: string;
  /**
   * A remote asset, fetched once at the CLI boundary and embedded as a `data:` URI before the
   * document is composed. Rendering itself still makes no request.
   *
   * Two costs come with this, both accepted deliberately. The person running the render must
   * pass `--allow-remote`, because a spec file is something people share and rendering one
   * should not silently fetch from a host its author chose. And a URL gives up determinism:
   * the bytes at the other end can change or disappear, so the same spec at the same version
   * stops guaranteeing the same output. Prefer `path` when you can.
   */
  url?: string;
  /** Rendered height in CSS pixels. Defaults to whatever the layout uses for its wordmark. */
  height?: number;
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
  /** Which preset draws it: red wording, the yellow band, or a hairline. */
  disclaimerStyle: DisclaimerStyle;
  /** deviceScaleFactor. */
  scale: 1 | 2 | 3;
  /** What to do when user text contains a banned character. */
  chars: CharPolicy;
  /** Output path or directory. */
  out: string;
}

export type CharPolicy = 'error' | 'warn' | 'off';

/**
 * A post on X.
 *
 * Note what is not here: an `outlet`. X is a platform, not a publication, so there is no
 * masthead to theme and no editorial convention to reproduce. The look belongs to the
 * platform and lives beside its layout rather than in the outlet registry. That distinction
 * is the reason this kind is in the proof of concept at all: it is the check that the model
 * did not quietly conflate who publishes something with how it looks.
 */
export interface XPostInject {
  kind: 'x-post';
  author: XAuthor;
  text: string;
  /** ISO 8601 with an offset, for the same reason `publishedAt` is. */
  postedAt: string;
  /**
   * Continuation posts by the same author, drawn as one connected thread in one image.
   *
   * A rumour spreading across three posts is a more realistic inject than a single post, and
   * a thread is the same block repeated with a connector, so it is close to free.
   */
  thread?: string[];
  metrics?: XMetrics;
  theme?: XTheme;
}

export interface XAuthor {
  name: string;
  /** Without the leading at sign, which the layout adds. */
  handle: string;
  /** A redrawn, simplified badge. Never the platform's own mark. */
  verified?: 'blue' | 'gold' | 'grey' | false;
  /** Local image path. Omitted means a generated initials block, which is the default. */
  avatar?: string;
}

export interface XMetrics {
  replies?: number;
  reposts?: number;
  likes?: number;
  views?: number;
}

export type XTheme = 'light' | 'dim' | 'dark';
