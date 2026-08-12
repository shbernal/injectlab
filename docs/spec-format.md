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

## `kind: news`

| Field           | Required | Default                       | Notes                                                                       |
| --------------- | -------- | ----------------------------- | --------------------------------------------------------------------------- |
| `outlet`        | yes      |                               | An id from `inject outlets`                                                 |
| `headline`      | yes      |                               |                                                                             |
| `publishedAt`   | yes      |                               | ISO 8601 with an offset                                                     |
| `standfirst`    | no       | none                          | The deck or chapeau under the headline                                      |
| `byline`        | no       | none                          | The name alone. The outlet decides whether it becomes `By ...` or `Par ...` |
| `section`       | no       | the outlet's own default      |                                                                             |
| `body`          | no       | none                          | A list of lead paragraphs                                                   |
| `url`           | no       | synthesised from the headline | Shown where a layout has an address bar. Never fetched                      |
| `image.path`    | no       | none                          | Local file, embedded into the page                                          |
| `image.caption` | no       | none                          |                                                                             |
| `image.credit`  | no       | none                          |                                                                             |
| `variant`       | no       | `desktop`                     | `desktop`, `mobile` or `card`                                               |

`variant` selects a viewport, not a pixel size. `card` is the 1200 by 630 social preview shape
and is the only one with a fixed height; the others capture the full page.

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
