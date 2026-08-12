# AGENTS.md

Working notes for agents and for future me. Read `README.md` first for what the project is.

## Pre-release

This project has no GitHub release yet.

- Treat it as pre-release and free to change.
- Do not preserve backwards compatibility unless asked.
- Do not defer to the prior architecture when it conflicts with the current goal.
- Existing code and docs are context, not constraints.
- Prefer the simplest coherent architecture for the current direction.

Once there is a release, compatibility and migration become real constraints.

## Commands

| Command           | Does                                                            |
| ----------------- | --------------------------------------------------------------- |
| `pnpm check`      | the whole gate: typecheck, lint, format, test, build, charcheck |
| `pnpm typecheck`  | `tsc` over sources, tests and tools, no emit                    |
| `pnpm build`      | `tsc -b`, both packages, into `dist/`                           |
| `pnpm test`       | vitest, against `src` rather than `dist`                        |
| `pnpm lint:chars` | charcheck, over prose, rendered strings and demos               |
| `pnpm format:fix` | oxfmt, in place                                                 |

`pnpm check` is the smallest useful verification command. Run it before every commit.

## Conventions

- **Node 24 or newer, ESM only.** No CommonJS anywhere.
- **TypeScript 7**, strict, with `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`
  on. `skipLibCheck` is off deliberately, so a broken dependency type is a build failure here
  rather than a surprise later.
- **Tests import `../src/*.js`**, not the package name, so they never depend on a build.
  `@injectlab/core` is aliased to its source in `vitest.config.ts` for the same reason.
- **No em dashes anywhere**, in code, prose, demo specs or commit messages. charcheck enforces
  it and the commit-msg hook blocks it. Use a comma, a colon, or reword.
- **Never write a banned character literally into `charcheck.config.js`.** Build it from its
  code point, or the config becomes a finding in itself.

## Architecture rules that are settled

- **Outlets are authored data, not scraped pages.** The renderer never touches the network.
  Live pages are fetched only by a dev-only capture tool under `tools/`, only to inform the
  person or agent authoring an outlet theme, and captures land in `.references/`, which is
  git-ignored.
- **Rendering sits behind a `Renderer` interface.** Headless Chromium via Playwright is the
  first implementation. A lighter backend can be added later for the layouts that fit it.
- **No real logo files and no licensed font binaries enter this repository.** Mastheads are
  set in open-licensed typefaces or redrawn as simplified SVG, and each outlet records what
  it approximates.
- **Determinism is a test requirement.** The same spec at the same version produces the same
  HTML. `publishedAt` is always explicit or derived from the spec, never the clock at render
  time. Tests snapshot the composed HTML string, never PNG bytes: font rasterisation differs
  across operating systems and pixel snapshots would fail on CI for reasons unrelated to the
  change under test. PNG assertions are limited to it being a PNG, of the expected dimensions,
  carrying the provenance chunk.
- **charcheck is a runtime dependency of `@injectlab/core`**, not only a dev check. Rendering
  a headline containing an em dash or an invisible character is an error by default.

## Safety

Read the use policy in `README.md`. It is a design constraint, not a disclaimer. The visible
banner is on by default, the embedded PNG provenance is unconditional, and no feature is
added whose only purpose is to make an artefact harder to identify as synthetic.

## Commit messages

Write the message to a file and pass it with `git commit -F`, never as an inline multi-line
shell string. Describe the change on its own terms.
