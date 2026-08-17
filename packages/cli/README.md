# @injectlab/cli

The `inject` command line interface for
[injectlab](https://github.com/shbernal/injectlab), generator of crisis-exercise stimuli.

An _inject_ is a stimulus pushed into a crisis exercise: the regulator's email, the news article
that appears halfway through the morning and changes what the crisis cell is dealing with.
injectlab renders the visual ones. You describe an inject in a spec file, and it produces a
screenshot of a fabricated news article or social post carrying an exercise disclaimer, ready to
paste into an exercise email.

## Install

Not on npm yet, so install from a clone. Node 24 or newer, plus a Chromium build for the
renderer:

```bash
git clone https://github.com/shbernal/injectlab
cd injectlab
pnpm install
pnpm exec playwright install chromium
pnpm build
```

`inject doctor` checks the Node version and the Chromium build, and prints what to type if
something is missing. It is the most likely first run failure.

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

Northwind Logistics is fictional, as is every company named anywhere in this repository.

## Commands

| Command                      | Does                                                       |
| ---------------------------- | ---------------------------------------------------------- |
| `inject demo`                | render the built-in demos. Needs no arguments and no files |
| `inject news`                | one article from flags                                     |
| `inject render <spec...>`    | one or more spec files                                     |
| `inject outlets [--verbose]` | what this build knows, and what each outlet approximates   |
| `inject init [file]`         | a commented starter spec                                   |
| `inject doctor`              | check that this machine can render                         |

`inject <command> --help` prints the flags of one command.

## Driving it from a script or an agent

`--json` puts one machine-readable object on stdout and every diagnostic on stderr, so the two
never interleave. The exit code says what went wrong without parsing anything:

| Code | Means                          |
| ---- | ------------------------------ |
| `0`  | done                           |
| `1`  | a render failed                |
| `2`  | bad usage                      |
| `3`  | a banned character in the copy |
| `4`  | a spec that did not validate   |

`--allow-remote` is off by default, so rendering someone else's spec does not reach a host that
spec chose.

## Outlets

`bbc`, `lemonde`, `lesechos`, `capital` and `20minutes`, plus `kind: x-post` for posts and
threads. Outlets are authored themes rather than scraped pages, so output does not change on the
day a publication redesigns its site. Marks and typefaces are approximations, never the real
assets, and `inject outlets --verbose` prints what each one approximates.

## Use policy

This tool fabricates convincing press coverage attributed to real organisations. That is normal
and necessary for crisis exercises, and it is also the raw material of a real hoax, so the
position is stated rather than buried:

- **The disclaimer is on by default.** `--disclaimer-style band` draws the loudest version at
  both ends, and it is the only one that survives someone screenshotting half an asset out of an
  email.
- **The embedded provenance is not switchable.** Every PNG carries metadata marking it as
  synthetic exercise material, whether or not the visible band is on. `--disclaimer none`
  removes the bands and does not touch the metadata.
- **This is for authorised exercises**, run with informed exercise controllers, under the usual
  exercise-safety conventions.
- **No feature exists whose only purpose is to make an artefact harder to identify as
  synthetic.**

The long form, including what will not be built, is in
[`docs/use-policy.md`](https://github.com/shbernal/injectlab/blob/main/docs/use-policy.md).

## Docs

The spec format, a worked scenario and the render pipeline are documented in the
[repository](https://github.com/shbernal/injectlab#readme).

## Licence

MIT
