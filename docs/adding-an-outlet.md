# Adding an outlet

Adding an outlet is a data-authoring task. If it turns into a code change, something is
wrong: either the theme is missing a field, or the outlet genuinely belongs to a new layout
family. Both are worth stopping to think about, and neither is fixed by special-casing one
outlet inside a layout.

This is a draft. It will be tightened once two outlets have actually been authored through
it.

## Before you start: what may not go in the repository

Outlets set their pages in licensed typefaces and head them with trademarked logos. Neither
may enter this repository, ever, in any form.

- A theme names an **open-licensed face from the bundled catalogue**, chosen for visual
  proximity. See `packages/core/src/fonts/catalogue.ts` for what is bundled and what each
  face is there to stand in for.
- A masthead is either a **wordmark** set in a bundled face, or a **simplified redraw** as
  inline SVG. Not a copy of the official asset.
- Every outlet states what it approximates in its `fidelity` note, and a test fails if that
  note is trivial.

Improving fidelity by fetching the real logo or the real font is not an improvement. It is
the single change this whole arrangement exists to prevent. If a request amounts to making
the output harder to tell apart from the genuine article, the answer is no.

## 1. Capture two or three articles

```bash
node tools/capture-reference.mjs https://www.example.com/news/articles/xxxx --id example
```

This writes `.references/<id>/`, which is git-ignored because it holds third-party content:

| File                     | What it is                                           |
| ------------------------ | ---------------------------------------------------- |
| `notes.json`             | measured typography per role, at desktop and mobile  |
| `page.html`              | the raw response, for when a measurement looks wrong |
| `screenshot-desktop.png` | the visual target                                    |
| `screenshot-mobile.png`  | the same, at 390 CSS pixels wide                     |

**Capture more than one article.** A single article can be an atypical template: a live
blog, a long read or a picture-led piece will each give you numbers that do not generalise.
Note that the tool overwrites `.references/<id>/` each run, so rename the directory between
captures if you want to compare.

The measurements come from `getComputedStyle` in a real browser, so they already have the
cascade, the custom properties and the responsive rules resolved. They are still a **starting
point, not truth**: the tool matches roles by generic selectors, and it will sometimes measure
the wrong element. It says so when a role matches nothing, and it exits non-zero. Read
`screenshot-desktop.png` before trusting `notes.json`.

Two failure modes worth recognising:

- **A consent wall or a paywall.** Every role matches something, and everything is wrong. The
  screenshot makes this obvious in a second, which is why the tool writes one.
- **A section front rather than an article.** The headline role matches a navigation heading.
  Check that the captured `headline.text` is the story's headline.

## 2. Decide the layout family

`LayoutFamily` in `packages/core/src/outlets/types.ts` is a closed union, and each value is
backed by one layout function shared by every outlet using it.

Only add a family when the existing ones genuinely cannot express the page with different
data. The failure mode to avoid is one family per outlet, which makes the tenth outlet as
expensive as the first, and it is reached one small concession at a time. A different
headline size, a different rule colour and a different masthead are all theme data. A
fundamentally different furniture arrangement is a family.

## 3. Fill in the record

Write `packages/core/src/outlets/<id>.ts` from `notes.json`. Everything in `OutletTheme` maps
to something the capture measured:

| Theme field              | Where it comes from                                                      |
| ------------------------ | ------------------------------------------------------------------------ |
| `fonts.*.face`           | the nearest bundled face to the captured `fontFamily`                    |
| `colors.text`            | the headline or body `color`                                             |
| `colors.rule`            | the divider's `borderTopColor`                                           |
| `scale.headlineSize`     | the headline's `fontSize`                                                |
| `scale.headlineLeading`  | its `lineHeight` divided by its `fontSize`                               |
| `scale.measure`          | the narrowest ancestor with a real `maxWidth`, from `headline.ancestors` |
| `conventions.dateFormat` | the rendered date string, reproduced                                     |

Write the `fidelity` note as you go, not afterwards. Written afterwards it becomes a summary
of what you did; written as you go it is a record of each compromise at the moment you made
it, which is what it is for.

## 4. Produce the masthead

Choose a wordmark when the outlet's masthead is essentially typographic, which is more often
than it looks. Choose a simplified inline SVG redraw when the shape is the recognisable part.
Either way, state the choice in `fidelity`.

## 5. Iterate against the reference

Render the outlet's demo spec and put the PNG beside `.references/<id>/screenshot-desktop.png`.
Adjust the numbers until a person who reads that outlet daily would not stop on it.

That is the acceptance bar, and it is subjective on purpose. No pixel metric captures
"looks right", and a test that asserted one would fail on a font update rather than on a
regression.

## 6. Register it

Add the import and one line to `OUTLETS` in `packages/core/src/outlets/registry.ts`, and add
a spec to `demos/`. `OutletId` is derived from that record, so the type, the CLI validation
and the "known outlets" error message all follow from the one line.

Then run `pnpm check`. The registry test loops every outlet and will tell you if the record
is half-authored: colours that are not hex, a weight the chosen face cannot produce, a
missing fidelity note, a layout family that does not exist.
