import type * as v from 'valibot';

import { describe, expectTypeOf, it } from 'vitest';

import type { NewsInjectSchema } from '../src/spec/schema.js';
import type { NewsInject } from '../src/spec/types.js';

/**
 * The schema validates and the interface documents. They describe the same thing, and this
 * is what stops one being edited without the other.
 *
 * The assertion is resolved by `tsc`, not at run time: `expectTypeOf` compiles away, so this
 * file passes vitest whatever it says and fails the typecheck when the two drift.
 */
describe('schema and hand-written types', () => {
  it('agree on NewsInject in both directions', () => {
    expectTypeOf<v.InferOutput<typeof NewsInjectSchema>>().toEqualTypeOf<NewsInject>();
  });
});
