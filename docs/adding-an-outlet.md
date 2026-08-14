# Adding an outlet

Adding an outlet is a data-authoring task. If it turns into a code change, something is
wrong: either the theme is missing a field, or the outlet genuinely belongs to a new layout
family. Both are worth stopping to think about, and neither is fixed by special-casing one
outlet inside a layout.

Five outlets have been authored through this, and it has held. What it did not predict is
that the third would need a new layout family, the fourth two new theme fields, and the fifth
a family again after a render proved it. All three cases are in step 2, and telling them apart
is the only hard judgement in this document.

## Before you start: what may not go in the repository

Outlets set their pages in licensed typefaces and head them with trademarked logos. Neither
may enter this repository, ever, in any form.

- A theme names an **open-licensed face from the bundled catalogue**, chosen for visual
  proximity. See `packages/core/src/fonts/catalogue.ts` for what is bundled and what each
  face is there to stand in for.
- Sometimes nothing in the catalogue is close. Capital sets its headlines in a condensed
  grotesque and the catalogue has no condensed face, so it names the nearest thing and says
  plainly in `fidelity` that the result runs wide and wraps a headline onto an extra line.
  Say so rather than picking a face that flatters the record: a stand-in nobody documented is
  the one that gets mistaken for a measurement later.
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

### When the site refuses to be visited

Some outlets answer an automated visit with a bot challenge, and you get a "Client Challenge"
page with no headline at all. Le Monde does. Les Echos answers "Access Denied". Do not guess
the numbers from the section front: that is how this project ended up with a Le Monde headline
size and column width that were both wrong by a wide margin. Get the markup another way, then
measure the file:

```bash
node tools/capture-reference.mjs <the article url> --id example --from-saved saved-page.html
```

The saved markup is served as the document at the URL you pass, so the stylesheets and fonts
still resolve against the real origin and the measurements are as real as a live capture.
Scripts are blocked, since running the page's own code only re-enters the challenge. A
Firefox "view source" save works and is unwrapped automatically, which matters because it is
often the only way to get the markup out of a page that will not be automated. `notes.json`
records which of the two paths produced it, under `source`.

The file does not have to come from a browser. What these sites refuse is the headless
browser, not the request: Les Echos serves its full server-rendered article to a plain
`fetch` and denies the same URL to Chromium, so writing the response to a file and passing it
to `--from-saved` is the whole of it. Try that before asking a human to save a page. What is
not on the table is dressing the browser up as something it is not; if a site refuses the
request itself, it has refused, and the answer is a different outlet or a human with a
browser.

Two things to watch when you measure a saved article:

- **Check the article is a plain news story.** Opinion, analysis and review templates carry
  modifier classes that change the headline weight, leading and column. Le Monde's `--opinion`
  variant is 800 over a 1.26 line in a 680px float where the news article is 500 over 1.11 at
  full width. Strip the modifiers in the page and re-measure if that is all you have.
- **Check whether you were signed in.** A subscriber layout can be wider. Le Monde's article
  column is 556px logged out and 664px logged in.

## 2. Decide the layout family

`LayoutFamily` in `packages/core/src/outlets/types.ts` is a closed union, and each value is
backed by one layout function shared by every outlet using it.

Only add a family when the existing ones genuinely cannot express the page with different
data. The failure mode to avoid is one family per outlet, which makes the tenth outlet as
expensive as the first, and it is reached one small concession at a time. A different
headline size, a different rule colour and a different masthead are all theme data. A
fundamentally different furniture arrangement is a family.

20 Minutes is the worked example of the second case, and of the test that separates them. Ask
what a reader recognises the publication by before it is read. For a French daily it is a
centred wordmark over a rule and one column running down the page, and Le Monde in another
palette is still that page. For 20 Minutes it is a saturated band of brand colour with the
masthead in it, pill breadcrumbs, and a headline set far wider than the body column beneath
it. None of those are values a theme could have supplied, so it became `fr-online-freesheet`.

Note what did **not** justify a family, because that is the harder half. A serif headline
where the other French outlet has a serif headline at a different size and weight, a numeric
date instead of a written month, a byline with no prefix, white text on the accent instead of
near black: all theme or convention data, and two of them were fields the model was missing
rather than reasons to write another layout.

Les Echos is the worked example of the other answer, and it looked like a family at first. Its
headline is centred in a 1000px block over a body column of 636px, where Le Monde runs one
556px column hard left the whole way down, and a page is not a small thing to change. But ask
the question the other way: what does a reader recognise Les Echos by? A centred wordmark over
a rule, a rubric above a serif headline, a subscriber marker in the furniture, one story
column. That is the French daily, and Le Monde is the same page with the two numbers set
equal. So `theme.hero` gained a measure and an alignment, `fr-online-daily` grew from one
column into three stacked bands that collapse back onto each other when the measures match,
and the family absorbed the second outlet instead of splitting.

The tell is that the difference had a number. A furniture arrangement that no value could
express is a family; a value the theme did not happen to carry yet is a field, however large
it looks on the page.

### When the argument will not settle it, render it

Capital is the case where the reasoning above ran out. It sits between the two French
families: a centred wordmark on white like the daily, a solid section bar and a rail beside
the story like the freesheet, a headline wider than its column like both. Every argument for
one family had an equally good argument for the other, and the numbers were no help because
`hero` and `measure` already expressed them.

What settled it was doing the cheap thing first. The record was authored against
`fr-online-daily`, which is a file and one line, and rendered. Three things were wrong, and
seeing them took a second where arguing about them had taken much longer:

- The whole top of the page. The daily draws a quiet centred row of section names; Capital's
  is a solid near-black band running edge to edge, and it is the second thing you see.
- `Article réservé aux abonnés`, which `fr-online-daily` draws unconditionally because both
  outlets in it are subscriber outlets. On a Capital page that is not a styling flaw, it is a
  false statement about the outlet.
- The story column centred under a left-ranged headline. Capital runs both flush to one edge
  and fills the difference with the rail, so centring puts the body where Capital never puts
  it.

Then the same test against the other candidate, which is the step worth not skipping: the
freesheet paints its masthead band with `--il-accent`, and Capital's accent is the yellow on
its subscribe button. Rendering it there would have meant recording the wrong colour as the
brand's to make the arrangement come out. A family that can only fit by falsifying a
measurement is not a fit.

So: argue it once, and if the argument does not settle, author it against the nearest existing
family and look at the result. A family costs a file and four wiring lines, so trying the
cheap answer first is nearly free, and a render is evidence in a way that a paragraph is not.
Keep the failed attempt in the outlet's own comment rather than deleting it, so the next
person can see the question was asked.

## 3. Fill in the record

Write `packages/core/src/outlets/<id>.ts` from `notes.json`. Everything in `OutletTheme` maps
to something the capture measured:

| Theme field              | Where it comes from                                                      |
| ------------------------ | ------------------------------------------------------------------------ |
| `fonts.*.face`           | the nearest bundled face to the captured `fontFamily`                    |
| `colors.text`            | the headline or body `color`                                             |
| `colors.onAccent`        | the text colour of whatever the accent fills: a tag, a pill, a band      |
| `colors.rule`            | the divider's `borderTopColor`                                           |
| `scale.headlineSize`     | the headline's `fontSize`                                                |
| `scale.headlineLeading`  | its `lineHeight` divided by its `fontSize`                               |
| `scale.measure`          | the narrowest ancestor with a real `maxWidth`, from `headline.ancestors` |
| `hero.measure`           | the same, measured around the headline rather than the body              |
| `hero.align`             | the headline's own `textAlign`                                           |
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
