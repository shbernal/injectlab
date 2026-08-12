# Spec format

A spec is YAML or JSON. It holds one inject, or a list of them under `injects:`. Both forms
render the same way.

```yaml
# one inject
kind: news
outlet: bbc
headline: ...
publishedAt: 2026-08-12T09:14:00+01:00
```

```yaml
# several
injects:
  - kind: news
    ...
  - kind: x-post
    ...
```

`kind` selects the shape of everything else. Two kinds exist.

## Rules that apply to every kind

**Timestamps need an offset.** `2026-08-12T09:14:00+01:00` or `2026-08-12T08:14:00Z`, never
`2026-08-12T09:14:00`. Without an offset the time would be read against whatever zone the
rendering machine is in, and the same spec would produce different assets on two laptops.

`inject news` on the command line is the one exception: with no `--published-at` it reads the
clock once and prints what it used. A spec _file_ is meant to reproduce, so the field stays
required there.

**No em dashes and no invisible characters** in any text that reaches the page. The render
stops before the browser starts and reports the field, the column and a suggested rewrite.
`--chars warn` renders anyway and reports; `--chars off` skips the check.

**Image paths are local files, resolved relative to the spec file.** Never URLs. Rendering
makes no network request of any kind, and a path that resolves differently on someone else's
machine is not an asset. A path that does not resolve is an error, not a broken image.

`masthead.url` is the single exception, and it is not one of these paths: it is fetched by the
CLI before composing, needs `--allow-remote`, and is embedded as a `data:` URI like everything
else. The render itself still makes no request. See below.

## `kind: news`

| Field             | Required | Default                       | Notes                                                                       |
| ----------------- | -------- | ----------------------------- | --------------------------------------------------------------------------- |
| `outlet`          | yes      |                               | An id from `inject outlets`                                                 |
| `headline`        | yes      |                               |                                                                             |
| `publishedAt`     | yes      |                               | ISO 8601 with an offset                                                     |
| `standfirst`      | no       | none                          | The deck or chapeau under the headline                                      |
| `byline`          | no       | none                          | The name alone. The outlet decides whether it becomes `By ...` or `Par ...` |
| `section`         | no       | the outlet's own default      |                                                                             |
| `body`            | no       | none                          | A list of lead paragraphs                                                   |
| `url`             | no       | synthesised from the headline | Shown where a layout has an address bar. Never fetched                      |
| `image.path`      | no       | none                          | Local file, embedded into the page                                          |
| `image.caption`   | no       | none                          |                                                                             |
| `image.credit`    | no       | none                          |                                                                             |
| `masthead.path`   | no       | the outlet's own masthead     | Local mark, embedded. See below                                             |
| `masthead.url`    | no       | the outlet's own masthead     | Remote mark. Needs `--allow-remote`                                         |
| `masthead.height` | no       | the layout's wordmark height  | CSS pixels                                                                  |
| `variant`         | no       | `desktop`                     | `desktop`, `mobile` or `card`                                               |

`variant` selects a viewport, not a pixel size. `card` is the 1200 by 630 social preview shape
and is the only one with a fixed height; the others capture the full page.

### Supplying your own masthead

Every bundled outlet ships an approximation of its masthead, because the real ones are
trademarks and are not in this repository. `masthead` replaces that approximation with a mark
you supply, for the case the tool actually has: an exercise on your own organisation's
newsroom, or a fictional outlet somebody drew for you.

```yaml
kind: news
outlet: bbc
headline: Northwind Logistics halts deliveries after an attack on its depots
publishedAt: 2026-08-12T09:14:00+01:00
masthead:
  path: ./brand/newsroom-mark.svg
  height: 40
```

Exactly one of `path` and `url`. PNG, JPEG, WebP, AVIF, GIF and SVG are accepted, and SVG is
usually what you want. The file is embedded as a `data:` URI, so the composed document stays
self-contained.

**This is not a fidelity feature for real publications.** Pointing it at a logo you downloaded
does not make that logo yours, and the answer to "can it look more like the real thing" is
still the one in `docs/use-policy.md`. What ships in the box is unchanged: every bundled outlet
still approximates, and the disclaimer bands and PNG provenance are untouched either way.

**`url` costs you two things, both deliberate.**

The person running the render must pass `--allow-remote`. A spec file is something people pass
around, and rendering one should not quietly fetch from a host its author chose. Without the
flag a spec naming a URL fails with exit code 2 and nothing is fetched.

```
$ inject render leak.yaml
a spec names a remote masthead: https://assets.example.com/mark.svg
Rendering it would fetch from that host, which is off by default.
Pass --allow-remote to permit it, or use a local masthead.path instead.
```

And it gives up determinism. "The same spec at the same version produces the same output" stops
holding, because the bytes at the far end can change or disappear. Prefer `path` when you can.

The fetch happens once per URL, in the CLI, before the browser starts. The bytes are not
verified beyond `http`/`https` only, a 10 second timeout, a 2 MB cap and a `Content-Type` that
has to be an image. What you point it at is your risk. The mark renders as
`<img src="data:...">`, so even an SVG cannot run script or pull anything further.

## `kind: x-post`

X is a platform, not a publication, so there is no `outlet` and no masthead to choose.

| Field             | Required | Default            | Notes                                                               |
| ----------------- | -------- | ------------------ | ------------------------------------------------------------------- |
| `author.name`     | yes      |                    | Display name                                                        |
| `author.handle`   | yes      |                    | Without the at sign. Letters, digits and underscores, up to 15      |
| `text`            | yes      |                    |                                                                     |
| `postedAt`        | yes      |                    | ISO 8601 with an offset                                             |
| `author.verified` | no       | none               | `blue`, `gold`, `grey` or `false`                                   |
| `author.avatar`   | no       | generated initials | Local image path                                                    |
| `thread`          | no       | none               | Continuation posts by the same author, drawn as one connected image |
| `metrics.replies` | no       | hidden             | Whole number                                                        |
| `metrics.reposts` | no       | hidden             |                                                                     |
| `metrics.likes`   | no       | hidden             |                                                                     |
| `metrics.views`   | no       | hidden             |                                                                     |
| `theme`           | no       | `light`            | `light`, `dim` or `dark`                                            |

If no metric is given the row is omitted entirely rather than shown as zeroes. Metrics are
formatted the way the platform formats them: `1.2K`, `412K`, `1.2M`.

**A thread shares one timestamp.** There is currently no way to give each post in a thread its
own time. If the times matter, write the posts as separate injects in one file instead. See
[`roadmap.md`](./roadmap.md) for this and the other known gaps in the model.

## Render options

These are command-line flags rather than spec fields, because they are about how an asset is
produced rather than what it says.

| Flag           | Default                          |                                                                                |
| -------------- | -------------------------------- | ------------------------------------------------------------------------------ |
| `--out`        | `out`                            | A file when there is one result and it has an extension, a directory otherwise |
| `--format`     | `png`                            | `html` writes the composed document instead, and launches no browser           |
| `--scale`      | `2`                              | Device pixel ratio                                                             |
| `--variant`    | each kind's own                  | Overrides the viewport                                                         |
| `--disclaimer` | `[EXERCISE, EXERCISE, EXERCISE]` | Any text, or `none` to omit the bands                                          |
| `--chars`      | `error`                          | `warn` or `off`                                                                |
| `--json`       | off                              | One object on stdout, diagnostics on stderr                                    |

`--disclaimer none` removes the visible bands. It does not remove the embedded PNG metadata
marking the file as synthetic exercise material, which is not switchable. See
[`use-policy.md`](./use-policy.md).
