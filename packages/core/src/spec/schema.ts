import * as v from 'valibot';

import { listOutletIds } from '../outlets/registry.js';

/**
 * Runtime validation for spec files.
 *
 * The schema is the single description of the format. The TypeScript interfaces in
 * `types.ts` are written by hand rather than inferred, because they are the documented
 * surface and a hand-written interface with its comments reads better than an inferred one.
 * `tests/schema-types.test.ts` asserts the two are mutually assignable, so the pair cannot
 * drift without a red test.
 */

const OUTLET_IDS = listOutletIds();

const nonEmpty = (label: string) =>
  v.pipe(v.string(), v.trim(), v.minLength(1, `${label} is empty`));

const outletId = v.picklist(
  OUTLET_IDS,
  `unknown outlet, expected one of: ${OUTLET_IDS.join(', ')}`,
);

/**
 * An offset is required, not optional. A local timestamp would be read against whatever
 * zone the renderer happened to run in, which is exactly the non-determinism the format
 * exists to avoid.
 */
const isoInstant = v.pipe(
  v.string(),
  v.regex(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:\d{2})$/u,
    'expected an ISO 8601 timestamp with an offset, for example 2026-08-12T09:14:00+01:00',
  ),
  v.check((value) => !Number.isNaN(Date.parse(value)), 'not a real date'),
);

export const ImageSchema = v.object({
  path: nonEmpty('image.path'),
  caption: v.exactOptional(v.string()),
  credit: v.exactOptional(v.string()),
});

/**
 * Exactly one of `path` and `url`, checked on the object rather than expressed as a union.
 *
 * `v.union` would report the failure at the union and discard the field path, which is the
 * whole value of this layer, and there is no discriminator here for `v.variant` to dispatch
 * on. A `check` on the object keeps `masthead` in the path and lets the message name both
 * keys, which is what someone who wrote neither actually needs to read.
 */
export const MastheadSchema = v.pipe(
  v.object({
    path: v.exactOptional(nonEmpty('masthead.path')),
    url: v.exactOptional(nonEmpty('masthead.url')),
    height: v.exactOptional(v.pipe(v.number(), v.minValue(1))),
  }),
  v.check(
    (value) => (value.path === undefined) !== (value.url === undefined),
    'masthead needs exactly one of path or url',
  ),
  v.check(
    (value) => value.url === undefined || /^https?:\/\//u.test(value.url),
    'masthead.url must be http or https',
  ),
);

export const NewsInjectSchema = v.object({
  kind: v.literal('news'),
  outlet: outletId,
  headline: nonEmpty('headline'),
  standfirst: v.exactOptional(v.string()),
  byline: v.exactOptional(v.string()),
  section: v.exactOptional(v.string()),
  publishedAt: isoInstant,
  body: v.exactOptional(v.array(v.string())),
  url: v.exactOptional(v.string()),
  image: v.exactOptional(ImageSchema),
  masthead: v.exactOptional(MastheadSchema),
  variant: v.exactOptional(v.picklist(['desktop', 'mobile', 'card'])),
});

const handle = v.pipe(
  v.string(),
  v.regex(
    /^[A-Za-z0-9_]{1,15}$/u,
    'a handle is 1 to 15 letters, digits or underscores, with no at sign',
  ),
);

const count = v.pipe(v.number(), v.integer(), v.minValue(0));

export const XPostInjectSchema = v.object({
  kind: v.literal('x-post'),
  author: v.object({
    name: nonEmpty('author.name'),
    handle,
    verified: v.exactOptional(v.union([v.picklist(['blue', 'gold', 'grey']), v.literal(false)])),
    avatar: v.exactOptional(v.string()),
  }),
  text: nonEmpty('text'),
  postedAt: isoInstant,
  thread: v.exactOptional(v.array(v.string())),
  metrics: v.exactOptional(
    v.object({
      replies: v.exactOptional(count),
      reposts: v.exactOptional(count),
      likes: v.exactOptional(count),
      views: v.exactOptional(count),
    }),
  ),
  theme: v.exactOptional(v.picklist(['light', 'dim', 'dark'])),
});

/**
 * Dispatching on `kind` rather than unioning the two object schemas: `v.variant` reports the
 * failure against the discriminator and keeps the field paths, which a plain union throws
 * away. Same reason `parse.ts` picks the batch schema by shape.
 */
export const InjectSpecSchema = v.variant('kind', [NewsInjectSchema, XPostInjectSchema]);

/**
 * A file may hold one inject or a list of them, and `parse.ts` picks the schema by looking
 * for an `injects` key before validating.
 *
 * That dispatch is deliberate and a union is not used here. Under `v.union` valibot reports
 * the failure at the union itself, so a spec with a bad headline came back as "Invalid type:
 * Expected Object but received Object" at the document root, with the field path discarded.
 * Field paths are the entire value of this layer.
 */
export const BatchSchema = v.object({ injects: v.array(InjectSpecSchema) });
