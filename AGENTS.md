# AGENTS.md

Read `README.md` first for what the project is. This is what you need before changing it.

## Pre-release

No GitHub release exists yet. Treat the project as free to change: do not preserve backwards
compatibility unless asked, and do not defer to the prior architecture when it conflicts with
the current goal. Existing code and docs are context, not constraints. Once there is a
release, compatibility becomes a real constraint.

## Commands

| Command           | Does                                                      |
| ----------------- | --------------------------------------------------------- |
| `pnpm check`      | the gate: typecheck, lint, format, test, build, charcheck |
| `pnpm typecheck`  | `tsc` over sources, tests and tools, no emit              |
| `pnpm build`      | `tsc -b`, both packages, into `dist/`                     |
| `pnpm clean`      | `tsc -b --clean`. Use this, not `rm -rf dist`             |
| `pnpm test`       | vitest, against `src` rather than `dist`                  |
| `pnpm format:fix` | oxfmt, in place                                           |

Run `pnpm check` before every commit. `INJECTLAB_E2E=1 pnpm test` adds the tests that launch a
browser; they are opt-in because the ordinary gate has no business needing a Chromium
download.

## The package split

- `@injectlab/core` is the model and the pipeline: spec types and schema, outlet themes, the
  character gate, composition, and the renderer interface.
- `@injectlab/cli` is thin. Parse arguments, call core, print well. It holds no layout, no
  outlet knowledge and no rendering logic beyond choosing a renderer.
- `PlaywrightRenderer` lives at `@injectlab/core/playwright`, a separate entry point, so
  importing core in a test that never renders neither pays for Playwright nor fails without a
  browser. Nothing else in core may import it at module scope.

## Rules that are settled

**Outlets are data, layouts are code.** Adding an outlet is a file in
`packages/core/src/outlets/` plus one line in the registry. If it needs a layout change,
either the theme is missing a field or the outlet belongs to a new layout family. No layout
may name an outlet, and a test greps for that.

**Never fetch a real logo or a licensed font.** Outlets use licensed typefaces and trademarked
logos and neither may enter this repository in any form. Themes name an open-licensed face
from `packages/core/src/fonts/catalogue.ts`; mastheads are wordmarks or simplified redraws.
Every outlet's `fidelity` note says what it approximates, and a test fails if that note is
trivial. Improving fidelity by fetching the real asset is the one change this arrangement
exists to prevent.

**Rendering makes no network request.** Fonts and images are embedded as `data:` URIs. Live
pages are read only by `tools/capture-reference.mjs`, which is dev-only, imported by nothing,
and writes to the git-ignored `.references/`.

`render/remote.ts` is the one module that fetches, and it is off the compose path by
construction: nothing reachable from `buildDocument` imports it, and a test in
`tests/masthead.test.ts` walks the import graph to keep it that way. The CLI resolves
`masthead.url` to a `data:` URI first, then composes. A `fetch` reachable from `buildDocument`
would break the self-contained document, the offline test suite and determinism in one go.
This is why the composer throws its own `UnresolvedMastheadError` rather than importing the
error type from `remote.ts`.

**The disclaimer is on by default and the embedded PNG provenance is unconditional.**
`--disclaimer none` removes the visible bands and does not touch the metadata. Do not add a
way to remove it. See `docs/use-policy.md` for what else will not be built.

**No em dashes and no invisible characters**, in code, prose, demo specs or commit messages.
charcheck enforces it and the commit-msg hook blocks it. Use a comma, a colon, or reword.
Never write a banned character literally into `charcheck.config.js`: build it from its code
point, or the config becomes a finding in itself.

**Determinism is a test requirement.** The same spec at the same version produces the same
HTML. Nothing in composition reads a clock, a locale default or an environment variable. The
CLI reads the clock once, at its own boundary, and says what it used.

## Conventions

- **Node 24 or newer, ESM only.** No CommonJS anywhere.
- **TypeScript 7**, strict, with `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`.
  `skipLibCheck` is off deliberately, so a broken dependency type is a build failure here
  rather than a surprise later. `dom` is in `lib` because this package really does contain
  code that runs in a browser.
- **valibot: use `v.exactOptional`, not `v.optional`.** Plain `optional` infers `T | undefined`
  and does not satisfy a hand-written optional property under `exactOptionalPropertyTypes`.
- **valibot: do not use `v.union` for spec shapes.** It reports the failure at the union and
  discards the field path, which is the entire value of that layer. Dispatch on the shape or
  use `v.variant`.
- **Escaping is the default.** Markup is built with the `html` tagged template in
  `render/html.ts`; the only way past it is `raw()`. Do not concatenate markup by hand.
- **Tests import `../src/*.js`**, not the package name, so they never depend on a build.
- **Golden snapshots redact `data:` blobs** and are excluded from oxfmt. They are generated;
  do not hand-edit them.
- **Asserting a markup element is absent needs `class="..."`**, because the class name is also
  in the stylesheet. This has caught people three times.

## Where things are

| Path                             |                                                        |
| -------------------------------- | ------------------------------------------------------ |
| `packages/core/src/spec/`        | inject types, valibot schema, parsing                  |
| `packages/core/src/outlets/`     | one file per outlet, plus the registry                 |
| `packages/core/src/render/`      | composition, layouts, fonts, provenance, renderers     |
| `packages/core/src/fonts/`       | the bundled typeface catalogue                         |
| `packages/core/assets/fonts/`    | the WOFF2 files and their licences                     |
| `packages/cli/src/demo-specs.ts` | what `inject demo` renders, built in rather than files |
| `demos/`                         | example spec files a human edits                       |
| `tools/`                         | dev-only, shipped in nothing                           |

## Adding an outlet

Read `docs/adding-an-outlet.md`. In short: capture two or three real articles with
`tools/capture-reference.mjs`, decide the layout family, fill the record from the measurements,
write the `fidelity` note as you go, compare the render against the capture until a regular
reader would not stop on it, then add the registry line.

The capture tool is a hint generator, not a scraper. Pointed at a section front it measures a
navigation heading and is quietly wrong. Read the screenshot it writes.

## Commit messages

Write the message to a file and pass it with `git commit -F`, never as an inline multi-line
shell string. Describe the change on its own terms.

No attribution trailer or footer. A message says what changed and why, not which tool wrote
it, so no `Co-Authored-By:` naming an agent, no session identifier and no `Generated with`
line. The `no-ai-attribution` job in `lefthook.yml` rejects the commit, and it comes from
[`shbernal/lefthook-rules`](https://github.com/shbernal/lefthook-rules) rather than from here,
so fix the message rather than the rule.
