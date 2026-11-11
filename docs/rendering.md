# Rendering

How a spec becomes a PNG, and which parts of that are load bearing.

```
spec  ->  character gate  ->  compose HTML  ->  headless Chromium  ->  PNG + provenance
```

## The character gate runs first

Before the browser is touched. A headline with an em dash is reported in milliseconds, rather
than after a Chromium launch. That ordering is asserted by a test: the fake renderer must not
have been called.

## Composition produces one self-contained document

Inline styles, fonts and images as `data:` URIs, no external reference of any kind. The
render spike checked this once by routing every request to `abort()` and seeing the page issue
none. What guards it now is the self-containment test in `compose.test.ts` and the import-graph
test in `masthead.test.ts` that keeps the one fetching module off the compose path.

That is what makes a render reproducible. There is no font cache to be warm or cold, no
filesystem layout to get wrong, and no site that might have redesigned since yesterday.

**Escaping is the default, not a discipline.** Markup is assembled with a tagged template
where every interpolation escapes, and the only way past it is `raw()`, one greppable word.
This tool's entire input is attacker-shaped text by design, and a headline containing
`</style>` has to produce a funny headline rather than a broken page.

**Layouts read custom properties and nothing else.** No layout names a colour, a family or a
metric. That is what keeps adding an outlet a data change. If a layout needs a value the theme
does not expose, the theme gains a field.

## Fonts

Six open-licensed families ship in `packages/core/assets/fonts/`, each with its licence text.
All six are variable across weights 400 to 700 in a single file, so each family produces one
`@font-face` with a weight _range_ and the browser interpolates. Weight 500 is therefore a
real weight to ask for, not a synthesised approximation, which matters: the BBC headline is
one.

`font-display: block` rather than `swap`. A screenshot taken during a swap would show the
fallback face, and there is no reader here whose reading a block would delay.

The renderer still awaits `document.fonts.ready` before capturing. Measured, it is free: a
`data:` font is not a fetch, so there is no request to race, and the fonts are ready before
`load` resolves even at `domcontentloaded`. It is kept because depending on the guarantee
beats depending on the mechanism staying true across Chromium versions.

## Determinism

The same spec at the same version produces the same HTML string, byte for byte. Nothing in
composition reads a clock, a locale default or an environment variable. Timestamps come from
the spec and are formatted in the _outlet's_ time zone, never the host's.

**Tests snapshot the composed HTML, never PNG bytes.** Font rasterisation differs across
operating systems, so a pixel snapshot would fail on CI for reasons unrelated to the change
under test. PNG assertions are limited to it being a PNG, of the expected dimensions, carrying
its provenance.

The golden snapshots redact the `data:` blobs before comparing. Left in, one snapshot is 95 KB
of base64, the diff is unreadable, and refreshing a font rewrites it for reasons that have
nothing to do with layout. That the fonts are embedded at all is asserted separately.

## Why a browser

Fidelity to a real news page needs real CSS layout and real web fonts. The cost is a browser
download on install, which `inject doctor` explains when it is missing.

Some numbers, measured on a laptop:

|                           |               |
| ------------------------- | ------------- |
| browser launch, warm      | ~130 ms       |
| `setContent`              | 20 to 70 ms   |
| full-page screenshot      | 250 to 300 ms |
| 8 assets sequential       | ~400 ms each  |
| 8 assets at concurrency 4 | ~305 ms each  |

**The screenshot dominates, not the launch.** Batches therefore reuse one browser and run at a
bounded concurrency of four, and there is no case for more: the screenshot is CPU-bound inside
the browser process, so four pages contend and the gain over sequential is about 1.3x. Twenty
assets in about six seconds is the right answer, and a worker pool or a renderer daemon would
be solving a problem nobody has.

Two things the renderer does that are easy to get wrong:

- **It memoises the launch promise, not the launched browser.** Caching the resolved value
  loses the race that batch rendering exists to create: two concurrent renders both find no
  browser, both launch one, and only the second is ever closed. The symptom is a command that
  writes every file it was asked for and then never exits.
- **A full-page capture uses a small viewport, not a tall one.** `fullPage` cannot go below the
  viewport height, so a 900px viewport pads every short document with empty background under
  the closing banner.

## Adding a backend

`Renderer` is deliberately tiny:

```ts
interface Renderer {
  render(html: string, target: RenderTarget): Promise<Uint8Array>;
  close(): Promise<void>;
}
```

It exists so a lighter backend, satori plus resvg with no browser download, can be added for
the layouts that fit it, without touching a single layout. It does not exist to abstract over
needs nobody has yet, and it should stay this size.

`PlaywrightRenderer` is at `@injectlab/core/playwright`, a separate entry point, so importing
`@injectlab/core` in a test that never renders neither pays for Playwright nor fails when no
browser is installed.

## Provenance

Written after the screenshot, unconditionally. The `tEXt` chunk framing is written by hand,
about fifty lines including the reader, rather than pulled from three small packages.

Marking replaces rather than accumulates: chunks are inserted after `IHDR` while a reader
takes the last one it sees, so a second pass used to leave the _old_ value winning. Any chunk
with a keyword injectlab owns is stripped before the new ones go in.

`tEXt` is Latin-1 by the specification, so anything outside it is dropped rather than mangled.
