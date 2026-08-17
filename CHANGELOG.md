# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

While the version stays below 1.0.0, a minor release may make a breaking change, and says so
against every entry that does. A patch release does not.

The two packages in this repository, `@injectlab/core` and `@injectlab/cli`, share one version
and one entry per release.

## [Unreleased]

## [0.0.1]

First public release. What follows is the shape of the thing rather than a list of changes,
since there is nothing before it to have changed.

### Added

- **An inject spec, and a renderer that turns one into a screenshot.** `kind: news` produces a
  fabricated news article, `kind: x-post` a post or a thread. A YAML or JSON file holds one
  inject or a list under `injects:`. The page is composed as HTML, fonts and images inlined
  into one self contained document, and screenshotted in headless Chromium, because fidelity to
  a real news page needs real CSS layout and real web fonts.

- **Five outlets**, each an authored theme rather than a scraped page: BBC News, Le Monde, Les
  Echos, Capital and 20 Minutes, across three layout families. At render time nothing touches
  the network, so an asset does not change on the day a publication redesigns its site, the
  test suite runs offline, and the same spec produces byte identical HTML on any machine.
  Layouts read theme variables and nothing else, which is what keeps the tenth outlet as cheap
  as the second. Adding one is a data authoring task, documented in
  [`docs/adding-an-outlet.md`](docs/adding-an-outlet.md).

- **The `inject` command line interface**: `demo`, `news`, `render`, `outlets`, `init` and
  `doctor`. `inject demo` renders the built-in set with no arguments and no spec file, and
  `inject doctor` checks the two things most likely to be missing on a first run. `--json` puts
  one machine-readable object on stdout with every diagnostic on stderr, and the exit code
  distinguishes a banned character from a spec that did not validate, which is the surface for
  driving this from a script or an agent.

- **An exercise disclaimer, on by default**, in three styles. `band` is the loudest and the only
  one that survives someone screenshotting half an asset out of an email.

- **Embedded PNG provenance, not switchable.** Every rendered asset carries metadata marking it
  as synthetic exercise material, whether or not the visible band is drawn. `--disclaimer none`
  removes the bands and does not touch the metadata.

- **A character gate.** No em dashes and no invisible characters reach the page, enforced over
  every user authored string before rendering rather than suggested in a style guide. A finding
  names the field and offers a rewrite. Timestamps are likewise required to carry a UTC offset.
  Both rules exist so that the same spec produces the same asset for everyone running the
  exercise, rather than one that depends on the machine it was rendered on.

- **A stated use policy.** This tool fabricates convincing press coverage attributed to real
  organisations, which is necessary for crisis exercises and is also the raw material of a real
  hoax. [`docs/use-policy.md`](docs/use-policy.md) records the position and, more usefully, what
  will not be built. No feature exists whose only purpose is to make an artefact harder to
  identify as synthetic.

### Notes

- No logo file and no licensed font binary is in this repository. Marks and typefaces are
  approximations, and each outlet records what it approximates; read them with
  `inject outlets --verbose`.
- Every company named anywhere in this repository is fictional.
