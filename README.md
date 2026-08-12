# injectlab

Generate realistic crisis-exercise stimuli as image assets.

An _inject_ is the standard term for a stimulus pushed into an exercise: the phone call, the
regulator's email, the news article that appears halfway through the morning and changes what
the crisis cell is dealing with. injectlab produces the visual ones. You describe an inject in
a spec file, and it renders a screenshot of a fabricated news article from a recognisable
outlet, carrying an exercise disclaimer, ready to paste into an exercise email.

**Status: early. The scaffold is in place and the render pipeline is being built.** Nothing is
published to npm yet.

## Why a CLI

Exercise designers, and increasingly agents driving the exercise build, want to produce twenty
assets from a spec file in one command, commit the specs next to the scenario, and regenerate
them when the scenario changes. A browser tool cannot be scripted, cannot be diffed and cannot
be checked into the scenario repository.

## How it works

- **Outlets are authored themes, not scraped pages.** An outlet is a data record holding
  typography, palette, masthead, date and byline conventions and a layout family. At render
  time injectlab never touches the network, so output is deterministic, testable offline, and
  unaffected by the day an outlet redesigns its site.
- **Rendering is headless Chromium.** Fidelity to a real news page needs real CSS layout and
  real web fonts, so the page is composed as HTML and screenshotted.
- **Adding an outlet is a data-authoring task**, not a code change.

## Use policy

This tool fabricates convincing press coverage attributed to real organisations. That is
normal and necessary for crisis exercises, and it is also the raw material of a real hoax.
The position here is stated plainly rather than buried:

- **The disclaimer is on by default.** Every rendered asset carries a visible
  `[EXERCISE, EXERCISE, EXERCISE]` banner unless you explicitly turn it off, and every PNG
  carries embedded metadata marking it as synthetic exercise material. The metadata is not
  switchable.
- **Marks and typefaces are approximations, never the real assets.** Outlets use licensed
  typefaces and trademarked logos. injectlab ships open-licensed typefaces chosen for visual
  proximity, and mastheads set in those typefaces or redrawn as simplified SVG. No real logo
  file and no licensed font binary is in this repository. Each outlet records what it
  approximates.
- **This is for authorised exercises**, run with informed exercise controllers, under the
  usual exercise-safety conventions: the `EXERCISE, EXERCISE, EXERCISE` framing goes on every
  artefact and on every message carrying one.
- **No feature exists whose only purpose is to make an artefact harder to identify as
  synthetic.** If a request amounts to removing the traces, the answer is no.

## Development

```bash
pnpm install
pnpm check
```

`pnpm check` runs the typecheck, the linter, the formatter, the tests, the build and
charcheck, in that order. That single command is the gate.

To enable the repository's git hooks, which run charcheck over staged content and over the
commit message:

```bash
git config core.hooksPath .githooks
```

## Layout

| Path            | Holds                                                         |
| --------------- | ------------------------------------------------------------- |
| `packages/core` | `@injectlab/core`: spec model, outlet themes, render pipeline |
| `packages/cli`  | `@injectlab/cli`: the `inject` binary                         |
| `demos/`        | example spec files                                            |
| `tools/`        | dev-only scripts, not shipped                                 |

## Licence

MIT
