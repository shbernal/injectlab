# @injectlab/core

Inject specs, outlet themes and the render pipeline behind
[injectlab](https://github.com/shbernal/injectlab).

An _inject_ is a stimulus pushed into a crisis exercise: the regulator's email, the news article
that appears halfway through the morning and changes what the crisis cell is dealing with.
injectlab renders the visual ones. You describe an inject in a spec, and it produces a
screenshot of a fabricated news article or social post carrying an exercise disclaimer.

This package is the library half. For the command line, use
[`@injectlab/cli`](https://github.com/shbernal/injectlab/tree/main/packages/cli) instead.

## Install

Not on npm yet, so install from a clone:

```bash
git clone https://github.com/shbernal/injectlab
cd injectlab
pnpm install
pnpm build
```

Node 24 or newer. Rendering to PNG needs Chromium, which comes from `playwright`, an optional
peer dependency:

```bash
pnpm exec playwright install chromium
```

Composing a document needs neither, and the entry points are split so that stays true: nothing
reachable from `@injectlab/core` imports Playwright, so it is importable in a test run with no
browser installed.

## Use

`parseSpec` validates spec text, `renderInject` renders one inject through a `Renderer`.

```ts
import { formatSpecErrors, parseSpec, renderInject } from '@injectlab/core';
import { PlaywrightRenderer } from '@injectlab/core/playwright';
import { writeFile } from 'node:fs/promises';

const parsed = parseSpec(specText, 'yaml');
if (!parsed.ok) throw new Error(formatSpecErrors('exercise.yaml', parsed.errors).join('\n'));

const renderer = new PlaywrightRenderer();
try {
  for (const inject of parsed.injects) {
    const { png } = await renderInject(inject, { renderer });
    await writeFile('./out/inject.png', png);
  }
} finally {
  await renderer.close();
}
```

`renderInject` returns the PNG as a `Uint8Array` and leaves writing it to the caller.
`renderAll` takes a list and reuses one browser across it. The PNG carries provenance metadata
marking it as synthetic exercise material, and that is added here rather than being optional.

To compose without a browser, which is what the test suite does:

```ts
import { buildDocument } from '@injectlab/core';

const html = await buildDocument(inject);
```

The result is one self contained HTML document, fonts and images inlined. Nothing reachable
from `buildDocument` fetches, reads a clock or reads a locale default, so the same spec
produces byte identical HTML on any machine.

## Two rules it enforces

- **Timestamps carry an offset.** A `publishedAt` without one is a validation error rather than
  a value quietly resolved against whatever zone the machine is in.
- **No em dashes and no invisible characters reach the page.** Every user authored string is
  scanned before rendering, and a finding names the field and offers a rewrite. `renderInject`
  throws `CharPolicyError` by default; pass `chars: 'warn'` to get the findings back in the
  result instead, or `'off'` to skip the scan. `gate` and `scanInject` expose the same check
  directly.

Both exist so that the same spec produces the same asset for everyone running the exercise.

## Outlets

`listOutlets` and `getOutlet` read the registry; `bbc`, `lemonde`, `lesechos`, `capital` and
`20minutes` are what this build knows. Outlets are authored themes rather than scraped pages,
so output does not change on the day a publication redesigns its site. Marks and typefaces are
approximations and each outlet records what it approximates. No logo file and no licensed font
binary is in this repository.

Adding one is a data authoring task rather than a code change:
[`docs/adding-an-outlet.md`](https://github.com/shbernal/injectlab/blob/main/docs/adding-an-outlet.md).

## Use policy

This library fabricates convincing press coverage attributed to real organisations. That is
necessary for crisis exercises and it is also the raw material of a real hoax, so the position
is stated rather than buried: the disclaimer is on by default, the embedded PNG provenance is
not switchable, and this is for authorised exercises. No feature exists whose only purpose is
to make an artefact harder to identify as synthetic.

The long form, including what will not be built, is in
[`docs/use-policy.md`](https://github.com/shbernal/injectlab/blob/main/docs/use-policy.md).

## Docs

The spec format, the outlet records and the render pipeline are documented in the
[repository](https://github.com/shbernal/injectlab#readme).

## Licence

MIT
