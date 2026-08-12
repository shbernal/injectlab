# injectlab

Generate realistic crisis-exercise stimuli as image assets.

An _inject_ is the standard term for a stimulus pushed into an exercise: the phone call, the
regulator's email, the news article that appears halfway through the morning and changes what
the crisis cell is dealing with. injectlab produces the visual ones. You describe an inject in
a spec file, and it renders a screenshot of a fabricated news article or social post, carrying
an exercise disclaimer, ready to paste into an exercise email.

![A fabricated BBC News article about a fictional company, with an exercise banner across the top and bottom](docs/images/example-bbc.png)

That is real output, banner included. Northwind Logistics is fictional, as is every company
named anywhere in this repository.

**Status: early.** The news and X pipelines work end to end. Nothing is published to npm yet.

## Install

Node 24 or newer.

```bash
pnpm install
pnpm exec playwright install chromium
pnpm build
```

`inject doctor` checks both of those and prints what to type if something is missing.

## Sixty seconds

```bash
inject demo
```

Renders the built-in demo set into `./out`. No arguments, no spec file, no network.

Then one of your own:

```bash
inject news --outlet bbc \
  --headline "Northwind Logistics hit by ransomware, deliveries halted" \
  --standfirst "The haulier says its depots are running on paper." \
  --byline "Helen Morrow" \
  --out ./out
```

Then from a file, which is how you would actually run an exercise:

```bash
inject init exercise.yaml
inject render exercise.yaml --out ./assets
```

See [`docs/example-exercise.md`](docs/example-exercise.md) for a worked scenario, from three
specs to a folder of assets.

## Commands

| Command                      | Does                                                       |
| ---------------------------- | ---------------------------------------------------------- |
| `inject demo`                | render the built-in demos. Needs no arguments and no files |
| `inject news`                | one article from flags                                     |
| `inject render <spec...>`    | one or more spec files                                     |
| `inject outlets [--verbose]` | what this build knows, and what each outlet approximates   |
| `inject init [file]`         | a commented starter spec                                   |
| `inject doctor`              | check that this machine can render                         |

`--json` puts one machine-readable object on stdout and every diagnostic on stderr, which is
the surface to drive this from an agent. Exit code `3` means a banned character in the copy,
`4` a spec that did not validate.

## The spec format

```yaml
kind: news
outlet: bbc
section: Technology
headline: Northwind Logistics hit by ransomware, deliveries halted across the UK
standfirst: The company said it had taken systems offline as a precaution.
byline: Technology reporter
publishedAt: 2026-08-12T09:14:00+01:00
body:
  - Northwind Logistics has taken its depot systems offline.
```

A file holds one inject or a list under `injects:`. Every field, per kind, is in
[`docs/spec-format.md`](docs/spec-format.md).

Two rules the tool enforces rather than suggests: timestamps need an offset, and no em dashes
or invisible characters reach the page. Both exist so the same spec produces the same asset on
anyone's machine.

## Outlets

| Id          | Outlet     |                         |
| ----------- | ---------- | ----------------------- |
| `bbc`       | BBC News   | UK online broadsheet    |
| `lemonde`   | Le Monde   | French online daily     |
| `20minutes` | 20 Minutes | French online freesheet |

Plus `kind: x-post` for posts and threads, which is a platform rather than a publication and
so takes no `outlet`.

Adding one is a data-authoring task, not a code change:
[`docs/adding-an-outlet.md`](docs/adding-an-outlet.md).

## How it works

- **Outlets are authored themes, not scraped pages.** At render time injectlab never touches
  the network, so output is deterministic, testable offline, and unaffected by the day an
  outlet redesigns its site.
- **Rendering is headless Chromium.** Fidelity to a real news page needs real CSS layout and
  real web fonts, so the page is composed as HTML and screenshotted.
- **Layouts read theme variables and nothing else.** No layout names a colour, a family or a
  metric, which is what keeps the tenth outlet as cheap as the second.

[`docs/rendering.md`](docs/rendering.md) has the detail, including why the tests snapshot HTML
and never pixels.

## Use policy

This tool fabricates convincing press coverage attributed to real organisations. That is
normal and necessary for crisis exercises, and it is also the raw material of a real hoax. The
position is stated plainly rather than buried:

- **The disclaimer is on by default.** `[EXERCISE, EXERCISE, EXERCISE]` in red across the top
  of every asset. `--disclaimer-style band` draws the loud yellow version at both ends
  instead, and it is the only one that survives someone screenshotting half of an asset out of
  an email.
- **The embedded provenance is not switchable.** Every PNG carries metadata marking it as
  synthetic exercise material, whether or not the visible band is on.
- **Marks and typefaces are approximations, never the real assets.** No logo file and no
  licensed font binary is in this repository. Each outlet records what it approximates; read
  them with `inject outlets --verbose`.
- **This is for authorised exercises**, run with informed exercise controllers, under the
  usual exercise-safety conventions.
- **No feature exists whose only purpose is to make an artefact harder to identify as
  synthetic.** If a request amounts to removing the traces, the answer is no.

The long form, including what will not be built, is in
[`docs/use-policy.md`](docs/use-policy.md).

## Development

```bash
pnpm check
```

Typecheck, lint, format, tests, build and charcheck, in that order. That single command is the
gate. `INJECTLAB_E2E=1` adds the tests that launch a browser.

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
| `demos/`        | example spec files, one scenario                              |
| `docs/`         | spec format, adding an outlet, rendering, use policy, roadmap |
| `tools/`        | dev-only scripts, not shipped                                 |

## Licence

MIT
